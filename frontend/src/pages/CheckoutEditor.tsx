import React, { useState, useEffect } from "react";
import { api, generateUUIDv7, RFC7807Problem } from "../services/api";

interface CheckoutEditorProps {
  initialProductId?: string;
  initialProductName?: string;
  initialPriceMinorUnits?: number;
  onOrderCreated?: (order: { id: string; order_number: string }) => void;
  notify?: (type: "success" | "error" | "warning" | "info", message: string) => void;
}

export const CheckoutEditor: React.FC<CheckoutEditorProps> = ({
  initialProductId,
  initialProductName,
  initialPriceMinorUnits,
  onOrderCreated,
  notify
}) => {
  const [customerEmail, setCustomerEmail] = useState<string>("customer@auraglow.example.com");
  const [paymentMethod, setPaymentMethod] = useState<string>("RAZORPAY");
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => generateUUIDv7());
  const [street, setStreet] = useState<string>("742 Evergreen Terrace");
  const [city, setCity] = useState<string>("Springfield");
  const [postalCode, setPostalCode] = useState<string>("97477");
  const [country, setCountry] = useState<string>("US");

  const [quantity, setQuantity] = useState<number>(1);
  const [productId, setProductId] = useState<string>(
    initialProductId || "00000000-0000-0000-0000-000000000201"
  );
  const [unitPrice, setUnitPrice] = useState<number>(initialPriceMinorUnits || 8800);
  const [productName, setProductName] = useState<string>(
    initialProductName || "Velvet Rose Hydrating Elixir"
  );

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [resultOrder, setResultOrder] = useState<{ id: string; order_number: string; status: string } | null>(null);
  const [errorProblem, setErrorProblem] = useState<RFC7807Problem | null>(null);

  useEffect(() => {
    if (initialProductId) setProductId(initialProductId);
    if (initialPriceMinorUnits) setUnitPrice(initialPriceMinorUnits);
    if (initialProductName) setProductName(initialProductName);
  }, [initialProductId, initialPriceMinorUnits, initialProductName]);

  const totalMinorUnits = unitPrice * quantity;

  const handleRegenerateKey = () => {
    const newKey = generateUUIDv7();
    setIdempotencyKey(newKey);
    if (notify) notify("info", `Generated new UUIDv7 Idempotency-Key: ${newKey}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorProblem(null);
    setResultOrder(null);

    const payload = {
      customer_email: customerEmail,
      items: [
        {
          product_id: productId,
          quantity: quantity,
          unit_price_minor_units: unitPrice
        }
      ],
      amount_minor_units: totalMinorUnits,
      currency_code: "USD",
      payment_method: paymentMethod,
      shipping_address: {
        street,
        city,
        postal_code: postalCode,
        country
      }
    };

    try {
      const created = await api.createOrder(payload, idempotencyKey);
      setResultOrder(created);
      if (notify) {
        notify("success", `Order ${created.order_number} created successfully! (Idempotency verified)`);
      }
      if (onOrderCreated) {
        onOrderCreated(created);
      }
    } catch (err: unknown) {
      const problem = err as RFC7807Problem;
      setErrorProblem(problem);
      if (notify) {
        notify("error", `Order creation failed: ${problem.detail || problem.title}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "var(--space-6)", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
          Checkout Console & Order Dispatch
        </h2>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: "var(--space-1) 0 0" }}>
          Submits state-mutating transactions with mandatory UUIDv7 Idempotency-Key header validation.
        </p>
      </div>

      {errorProblem && (
        <div
          role="alert"
          style={{
            padding: "var(--space-4)",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--status-error-bg)",
            color: "var(--status-error)",
            border: "1px solid var(--status-error)",
            marginBottom: "var(--space-6)"
          }}
        >
          <div style={{ fontWeight: 700 }}>
            {errorProblem.title} ({errorProblem.status})
          </div>
          <div style={{ marginTop: "var(--space-1)" }}>{errorProblem.detail}</div>
          {errorProblem.correlation_id && (
            <div style={{ fontSize: "var(--text-xs)", marginTop: "var(--space-1)" }}>
              Correlation ID: {errorProblem.correlation_id}
            </div>
          )}
        </div>
      )}

      {resultOrder && (
        <div
          role="status"
          style={{
            padding: "var(--space-4)",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--status-success-bg)",
            color: "var(--status-success)",
            border: "1px solid var(--status-success)",
            marginBottom: "var(--space-6)"
          }}
        >
          <div style={{ fontWeight: 700, fontSize: "var(--text-base)" }}>
            ✓ Order Created: {resultOrder.order_number}
          </div>
          <div style={{ fontSize: "var(--text-sm)", marginTop: "var(--space-1)" }}>
            UUID: {resultOrder.id} | Status: {resultOrder.status}
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-light)",
          padding: "var(--space-6)",
          boxShadow: "var(--shadow-sm)"
        }}
      >
        {/* Idempotency Key Banner */}
        <div
          style={{
            backgroundColor: "var(--bg-surface-elevated)",
            padding: "var(--space-4)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-strong)",
            marginBottom: "var(--space-6)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
            <div>
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", color: "var(--accent)" }}>
                RFC 7807 UUIDv7 Idempotency-Key:
              </span>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--text-main)", marginTop: "var(--space-1)" }}>
                {idempotencyKey}
              </div>
            </div>
            <button
              type="button"
              onClick={handleRegenerateKey}
              style={{
                padding: "var(--space-1) var(--space-3)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-light)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-main)",
                fontSize: "var(--text-xs)",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              ⟳ Generate New Key
            </button>
          </div>
        </div>

        {/* Customer Information */}
        <div style={{ marginBottom: "var(--space-5)" }}>
          <label
            htmlFor="customerEmail"
            style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-main)", marginBottom: "var(--space-1)" }}
          >
            Customer Email Address:
          </label>
          <input
            id="customerEmail"
            type="email"
            required
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "var(--space-2) var(--space-3)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-strong)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-main)",
              fontSize: "var(--text-sm)"
            }}
          />
        </div>

        {/* Selected Product & Cart Item */}
        <div
          style={{
            backgroundColor: "var(--bg-surface-elevated)",
            padding: "var(--space-4)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-light)",
            marginBottom: "var(--space-5)"
          }}
        >
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Cart Item Formulation
          </span>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--space-2)" }}>
            <div>
              <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "var(--text-base)" }}>
                {productName}
              </div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", }}>
                Unit Price: ${(unitPrice / 100).toFixed(2)} USD
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <label htmlFor="qtyInput" style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-muted)" }}>
                Qty:
              </label>
              <input
                id="qtyInput"
                type="number"
                min="1"
                max="50"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                style={{
                  width: "60px",
                  padding: "var(--space-1) var(--space-2)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-strong)",
                  backgroundColor: "var(--bg-surface)",
                  color: "var(--text-main)",
                  fontSize: "var(--text-sm)"
                }}
              />
            </div>
          </div>
        </div>

        {/* Payment Gateway Method */}
        <div style={{ marginBottom: "var(--space-5)" }}>
          <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-main)", marginBottom: "var(--space-1)" }}>
            Payment Gateway Option:
          </label>
          <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
            {["RAZORPAY", "PAYPAL", "COD"].map((method) => (
              <label
                key={method}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  padding: "var(--space-2) var(--space-4)",
                  borderRadius: "var(--radius-sm)",
                  border: paymentMethod === method ? "2px solid var(--primary)" : "1px solid var(--border-light)",
                  backgroundColor: paymentMethod === method ? "var(--primary-subtle)" : "var(--bg-surface)",
                  cursor: "pointer",
                  fontSize: "var(--text-sm)",
                  fontWeight: 600
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method}
                  checked={paymentMethod === method}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                {method === "RAZORPAY" ? "Razorpay Gateway" : method === "PAYPAL" ? "PayPal Express" : "Cash on Delivery"}
              </label>
            ))}
          </div>
        </div>

        {/* Shipping Address */}
        <div style={{ marginBottom: "var(--space-6)" }}>
          <span style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-main)", marginBottom: "var(--space-2)" }}>
            Shipping Destination:
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "var(--space-3)" }}>
            <input
              type="text"
              placeholder="Street Address"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              style={{
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-strong)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-main)",
                fontSize: "var(--text-sm)"
              }}
            />
            <input
              type="text"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-strong)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-main)",
                fontSize: "var(--text-sm)"
              }}
            />
            <input
              type="text"
              placeholder="Postal Code"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              style={{
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-strong)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-main)",
                fontSize: "var(--text-sm)"
              }}
            />
          </div>
        </div>

        {/* Total Summary and Submit Button */}
        <div
          style={{
            borderTop: "1px solid var(--border-light)",
            paddingTop: "var(--space-4)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>Total Order Amount:</span>
            <div style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--primary)" }}>
              ${(totalMinorUnits / 100).toFixed(2)} USD
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "var(--space-3) var(--space-6)",
              borderRadius: "var(--radius-sm)",
              border: "none",
              backgroundColor: "var(--primary)",
              color: "var(--text-inverse)",
              fontWeight: 700,
              fontSize: "var(--text-sm)",
              cursor: submitting ? "not-allowed" : "pointer",
              boxShadow: "var(--shadow-md)"
            }}
          >
            {submitting ? "Dispatching Order..." : "Confirm & Authorize Order"}
          </button>
        </div>
      </form>
    </div>
  );
};
