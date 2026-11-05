/**
 * Aura Glow Client API Service
 * Fully typed API client wiring all routes from api_contract.json
 * Supports RFC 7807 error envelopes and UUIDv7 Idempotency-Key generation
 */

export interface RFC7807Problem {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  correlation_id?: string;
}

export function generateUUIDv7(): string {
  const now = Date.now();
  const hexTime = now.toString(16).padStart(12, "0");
  const rand1 = Math.floor(Math.random() * 0x1000).toString(16).padStart(3, "0");
  const rand2 = Math.floor(Math.random() * 0x4000).toString(16).padStart(4, "0");
  const rand3 = Math.floor(Math.random() * 0x1000000000000).toString(16).padStart(12, "0");

  const p1 = hexTime.substring(0, 8);
  const p2 = hexTime.substring(8, 12);
  const p3 = `7${rand1}`;
  const p4 = ((parseInt(rand2, 16) & 0x3fff) | 0x8000).toString(16).padStart(4, "0");
  const p5 = rand3;

  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
}

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001";

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const error: RFC7807Problem = isJson
      ? data
      : {
          type: "https://api.enterprise.internal/errors/http-error",
          title: response.statusText || "Request Failed",
          status: response.status,
          detail: String(data)
        };
    throw error;
  }

  return data as T;
}

export const api = {
  // Liveness probe
  checkHealth: async () => {
    return request<{ status: string; version: string; service: string }>("/health");
  },

  // Deep readiness probe
  checkReadiness: async () => {
    return request<{ status: string; database: string; migrations: string }>("/api/v1/health/readiness");
  },

  // Executive Dashboard Telemetry
  getDashboardMetrics: async () => {
    return request<{
      total_orders: number;
      gross_merchandise_value: number;
      p99_latency_ms: number;
      sla_uptime_percent: number;
      active_alerts: number;
      recent_orders: Array<{
        id: string;
        order_number: string;
        customer_email: string;
        amount_minor_units: number;
        currency_code: string;
        status: string;
        created_at: string;
      }>;
    }>("/api/v1/dashboard/metrics");
  },

  // Products catalog
  getProducts: async (params?: { category?: string; search?: string; cursor?: string; page_size?: number }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.search) query.set("search", params.search);
    if (params?.cursor) query.set("cursor", params.cursor);
    if (params?.page_size) query.set("page_size", String(params.page_size));
    const qs = query.toString();
    return request<{
      items: Array<{
        id: string;
        name: string;
        sku: string;
        description: string;
        category: string;
        price_minor_units: number;
        currency_code: string;
        stock_quantity: number;
        image_url: string;
      }>;
      next_cursor: string | null;
      total_count: number;
    }>(`/api/v1/products${qs ? `?${qs}` : ""}`);
  },

  // Tenant-scoped orders list
  getOrders: async (params?: { status?: string; cursor?: string; page_size?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.cursor) query.set("cursor", params.cursor);
    if (params?.page_size) query.set("page_size", String(params.page_size));
    const qs = query.toString();
    return request<{
      items: Array<{
        id: string;
        order_number: string;
        customer_email: string;
        amount_minor_units: number;
        currency_code: string;
        status: string;
        payment_status: string;
        created_at: string;
      }>;
      next_cursor: string | null;
      total_count: number;
    }>(`/api/v1/orders${qs ? `?${qs}` : ""}`);
  },

  // Retrieve order by UUID
  getOrderById: async (id: string) => {
    return request<{
      id: string;
      order_number: string;
      status: string;
      customer_email: string;
      amount_minor_units: number;
      currency_code: string;
      payment_status: string;
      shipping_status: string;
      shipping_address: Record<string, unknown>;
      items: Array<{
        id: string;
        product_id: string;
        quantity: number;
        unit_price_minor_units: number;
        total_minor_units: number;
        product_name?: string;
      }>;
      created_at: string;
    }>(`/api/v1/orders/${id}`);
  },

  // Create order with required Idempotency-Key
  createOrder: async (
    orderData: {
      account_id?: string;
      customer_email: string;
      items: Array<{ product_id: string; quantity: number; unit_price_minor_units: number }>;
      amount_minor_units: number;
      currency_code: string;
      payment_method: string;
      shipping_address?: Record<string, unknown>;
    },
    idempotencyKey?: string,
    tenantId: string = DEFAULT_TENANT_ID
  ) => {
    const key = idempotencyKey || generateUUIDv7();
    return request<{
      id: string;
      order_number: string;
      status: string;
      amount_minor_units: number;
      currency_code: string;
      idempotency_key: string;
      version_num: number;
      created_at: string;
    }>("/api/v1/orders", {
      method: "POST",
      headers: {
        "Idempotency-Key": key,
        "X-Tenant-ID": tenantId
      },
      body: JSON.stringify(orderData)
    });
  },

  // Immutable audit logs ledger
  getAuditLogs: async (params?: { entity_type?: string; cursor?: string; page_size?: number }) => {
    const query = new URLSearchParams();
    if (params?.entity_type) query.set("entity_type", params.entity_type);
    if (params?.cursor) query.set("cursor", params.cursor);
    if (params?.page_size) query.set("page_size", String(params.page_size));
    const qs = query.toString();
    return request<{
      items: Array<{
        id: string;
        event_type: string;
        entity_type: string;
        entity_id: string;
        actor_id: string;
        actor_role: string;
        payload_hash: string;
        previous_state: Record<string, unknown>;
        new_state: Record<string, unknown>;
        created_at: string;
      }>;
      next_cursor: string | null;
      total_count: number;
    }>(`/api/v1/audit-logs${qs ? `?${qs}` : ""}`);
  },

  // Retrieve settings
  getSettings: async () => {
    return request<{
      payment_gateways: {
        razorpay: { enabled: boolean; key_id: string; webhook_verified: boolean };
        paypal: { enabled: boolean; client_id: string; sandbox: boolean };
        cod: { enabled: boolean; max_order_limit: number };
      };
      inventory_alert_threshold: number;
      rbac_roles: Array<{ role: string; description: string; permissions: string[] }>;
    }>("/api/v1/settings");
  },

  // Update settings
  updateSettings: async (settingsData: Record<string, unknown>, idempotencyKey?: string) => {
    const key = idempotencyKey || generateUUIDv7();
    return request<{
      status: string;
      updated_at: string;
      settings: Record<string, unknown>;
    }>("/api/v1/settings", {
      method: "PUT",
      headers: {
        "Idempotency-Key": key
      },
      body: JSON.stringify(settingsData)
    });
  },

  // Authentication login
  login: async (credentials: { email: string; password?: string; mfa_token?: string }) => {
    return request<{
      token: string;
      user: {
        id: string;
        email: string;
        full_name: string;
        role: string;
      };
      expires_in: number;
    }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials)
    });
  }
};
