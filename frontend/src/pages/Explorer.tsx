import React, { useEffect, useState } from "react";
import { api, RFC7807Problem } from "../services/api";
import { SkeletonLoader } from "../components/SkeletonLoader";

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  price_minor_units: number;
  currency_code: string;
  stock_quantity: number;
  image_url: string;
}

interface OrderDetail {
  id: string;
  order_number: string;
  status: string;
  customer_email: string;
  amount_minor_units: number;
  currency_code: string;
  payment_status: string;
  shipping_status: string;
  items: Array<{
    id: string;
    product_id: string;
    quantity: number;
    unit_price_minor_units: number;
    total_minor_units: number;
    product_name?: string;
  }>;
  created_at: string;
}

interface ExplorerProps {
  onSelectProductForCheckout?: (product: Product) => void;
}

export const Explorer: React.FC<ExplorerProps> = ({ onSelectProductForCheckout }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<RFC7807Problem | null>(null);

  // Drawer state for Order detail lookup
  const [orderLookupId, setOrderLookupId] = useState<string>("");
  const [drawerOrder, setDrawerOrder] = useState<OrderDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState<boolean>(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);

  const categories = ["", "Skincare", "Makeup", "Fragrance", "Haircare"];

  const fetchCatalog = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getProducts({
        category: selectedCategory || undefined,
        search: searchQuery || undefined
      });
      setProducts(res.items || []);
    } catch (err: unknown) {
      setError(err as RFC7807Problem);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCatalog();
  };

  const handleLookupOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderLookupId.trim()) return;
    setDrawerLoading(true);
    setDrawerError(null);
    try {
      const ord = await api.getOrderById(orderLookupId.trim());
      setDrawerOrder(ord);
    } catch (err: unknown) {
      const p = err as RFC7807Problem;
      setDrawerError(p.detail || "Order not found");
      setDrawerOrder(null);
    } finally {
      setDrawerLoading(false);
    }
  };

  return (
    <div style={{ padding: "var(--space-6)", maxWidth: "1440px", margin: "0 auto" }}>
      {/* Search and Category Filter Controls */}
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          padding: "var(--space-5)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-light)",
          marginBottom: "var(--space-6)",
          boxShadow: "var(--shadow-sm)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-4)" }}>
          <div>
            <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
              Cosmetics Atelier Catalog
            </h2>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: "var(--space-1) 0 0" }}>
              Explore luxury formulations, botanical serums, and organic lip pigments.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "var(--space-2)" }}>
            <input
              type="text"
              placeholder="Search formulations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search cosmetics catalog"
              style={{
                padding: "var(--space-2) var(--space-4)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-strong)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-main)",
                fontSize: "var(--text-sm)",
                minWidth: "240px"
              }}
            />
            <button
              type="submit"
              style={{
                padding: "var(--space-2) var(--space-4)",
                borderRadius: "var(--radius-sm)",
                border: "none",
                backgroundColor: "var(--primary)",
                color: "var(--text-inverse)",
                fontWeight: 600,
                fontSize: "var(--text-sm)",
                cursor: "pointer"
              }}
            >
              Search
            </button>
          </form>
        </div>

        {/* Category Pills */}
        <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-4)", flexWrap: "wrap" }}>
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat || "all"}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "var(--space-1) var(--space-3)",
                  borderRadius: "var(--radius-full)",
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  border: active ? "1px solid var(--primary)" : "1px solid var(--border-light)",
                  backgroundColor: active ? "var(--primary)" : "var(--bg-surface-elevated)",
                  color: active ? "var(--text-inverse)" : "var(--text-muted)",
                  cursor: "pointer"
                }}
              >
                {cat || "All Categories"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Order Quick Inspector Drawer Bar */}
      <div
        style={{
          backgroundColor: "var(--bg-surface-elevated)",
          padding: "var(--space-3) var(--space-5)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-light)",
          marginBottom: "var(--space-6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--space-3)"
        }}
      >
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-main)" }}>
          Authoritative Order Drawer Inspection:
        </span>
        <form onSubmit={handleLookupOrder} style={{ display: "flex", gap: "var(--space-2)" }}>
          <input
            type="text"
            placeholder="Enter Order UUID..."
            value={orderLookupId}
            onChange={(e) => setOrderLookupId(e.target.value)}
            aria-label="Order UUID lookup"
            style={{
              padding: "var(--space-1) var(--space-3)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-strong)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-main)",
              fontSize: "var(--text-xs)",
              width: "280px"
            }}
          />
          <button
            type="submit"
            disabled={drawerLoading}
            style={{
              padding: "var(--space-1) var(--space-3)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-light)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-main)",
              fontWeight: 600,
              fontSize: "var(--text-xs)",
              cursor: "pointer"
            }}
          >
            {drawerLoading ? "Inspecting..." : "Inspect Order"}
          </button>
        </form>
      </div>

      {drawerError && (
        <div
          role="alert"
          style={{
            padding: "var(--space-3)",
            backgroundColor: "var(--status-error-bg)",
            color: "var(--status-error)",
            borderRadius: "var(--radius-sm)",
            marginBottom: "var(--space-4)",
            fontSize: "var(--text-sm)"
          }}
        >
          {drawerError}
        </div>
      )}

      {drawerOrder && (
        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "2px solid var(--primary)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-5)",
            marginBottom: "var(--space-6)",
            boxShadow: "var(--shadow-md)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--primary)" }}>
              Order Details: {drawerOrder.order_number}
            </h3>
            <button
              type="button"
              onClick={() => setDrawerOrder(null)}
              style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "var(--text-lg)" }}
            >
              ×
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-3)", fontSize: "var(--text-sm)" }}>
            <div><strong>Customer:</strong> {drawerOrder.customer_email}</div>
            <div><strong>Amount:</strong> ${(drawerOrder.amount_minor_units / 100).toFixed(2)} {drawerOrder.currency_code}</div>
            <div><strong>Status:</strong> {drawerOrder.status}</div>
            <div><strong>Payment:</strong> {drawerOrder.payment_status}</div>
            <div><strong>Shipping:</strong> {drawerOrder.shipping_status}</div>
            <div><strong>Created:</strong> {new Date(drawerOrder.created_at).toLocaleString()}</div>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            padding: "var(--space-4)",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--status-error-bg)",
            color: "var(--status-error)",
            marginBottom: "var(--space-6)"
          }}
        >
          {error.detail}
        </div>
      )}

      {/* Catalog Grid */}
      {loading ? (
        <SkeletonLoader count={6} height="220px" />
      ) : products.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "var(--space-5)"
          }}
        >
          {products.map((prod) => (
            <div
              key={prod.id}
              style={{
                backgroundColor: "var(--bg-surface)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-light)",
                overflow: "hidden",
                boxShadow: "var(--shadow-sm)",
                display: "flex",
                flexDirection: "column",
                transition: "var(--transition-fast)"
              }}
            >
              <div
                style={{
                  height: "160px",
                  background: "var(--gradient-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative"
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: "var(--space-2)",
                    right: "var(--space-2)",
                    padding: "var(--space-1) var(--space-2)",
                    borderRadius: "var(--radius-full)",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    backgroundColor: prod.stock_quantity > 10 ? "var(--status-success-bg)" : "var(--status-warning-bg)",
                    color: prod.stock_quantity > 10 ? "var(--status-success)" : "var(--status-warning)"
                  }}
                >
                  {prod.stock_quantity > 0 ? `${prod.stock_quantity} in stock` : "Out of stock"}
                </span>
                <div style={{ fontSize: "var(--text-display)" }}>💄</div>
              </div>

              <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--accent)", fontWeight: 600, textTransform: "uppercase" }}>
                  {prod.category}
                </span>
                <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--text-main)", margin: "var(--space-1) 0" }}>
                  {prod.name}
                </h3>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", flexGrow: 1, margin: "0 0 var(--space-3)" }}>
                  {prod.description}
                </p>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                  <div>
                    <span style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--text-main)" }}>
                      ${(prod.price_minor_units / 100).toFixed(2)}
                    </span>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginLeft: "var(--space-1)" }}>
                      {prod.currency_code}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectProductForCheckout && onSelectProductForCheckout(prod)}
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      borderRadius: "var(--radius-sm)",
                      border: "none",
                      backgroundColor: "var(--primary)",
                      color: "var(--text-inverse)",
                      fontWeight: 600,
                      fontSize: "var(--text-xs)",
                      cursor: "pointer"
                    }}
                  >
                    Select for Order
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "var(--space-10)",
            backgroundColor: "var(--bg-surface)",
            borderRadius: "var(--radius-md)",
            border: "1px dashed var(--border-strong)"
          }}
        >
          <p style={{ fontSize: "var(--text-base)", color: "var(--text-muted)" }}>
            No products match the selected criteria.
          </p>
        </div>
      )}
    </div>
  );
};
