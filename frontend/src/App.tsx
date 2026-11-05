import React, { useState, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { FeedbackToasts, ToastMessage } from "./components/FeedbackToasts";
import { Dashboard } from "./pages/Dashboard";
import { Explorer } from "./pages/Explorer";
import { CheckoutEditor } from "./pages/CheckoutEditor";
import { AuditWorkflow } from "./pages/AuditWorkflow";
import { Settings } from "./pages/Settings";
import { Login } from "./pages/Login";
import { api } from "./services/api";

export const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [healthStatus, setHealthStatus] = useState<string>("healthy");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Selected product passed from Explorer to Checkout
  const [checkoutProduct, setCheckoutProduct] = useState<{
    id: string;
    name: string;
    price_minor_units: number;
  } | null>(null);

  const addToast = (type: "success" | "error" | "warning" | "info", message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    // Initial health probe
    api
      .checkHealth()
      .then((res) => {
        if (res.status === "healthy") {
          setHealthStatus("healthy");
        }
      })
      .catch(() => {
        setHealthStatus("degraded");
      });
  }, []);

  const handleSelectProduct = (product: { id: string; name: string; price_minor_units: number }) => {
    setCheckoutProduct(product);
    setCurrentTab("checkout");
    addToast("info", `Selected '${product.name}' for checkout.`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--bg-page)",
        color: "var(--text-main)",
        fontFamily: "var(--font-family)"
      }}
    >
      <Header currentTab={currentTab} onTabChange={setCurrentTab} healthStatus={healthStatus} />

      <main role="main" style={{ flexGrow: 1 }}>
        {currentTab === "dashboard" && <Dashboard />}
        {currentTab === "explorer" && <Explorer onSelectProductForCheckout={handleSelectProduct} />}
        {currentTab === "checkout" && (
          <CheckoutEditor
            initialProductId={checkoutProduct?.id}
            initialProductName={checkoutProduct?.name}
            initialPriceMinorUnits={checkoutProduct?.price_minor_units}
            notify={addToast}
            onOrderCreated={(ord) => {
              addToast("success", `Order ${ord.order_number} confirmed and sealed.`);
            }}
          />
        )}
        {currentTab === "audit" && <AuditWorkflow />}
        {currentTab === "settings" && <Settings notify={addToast} />}
        {currentTab === "login" && <Login notify={addToast} />}
      </main>

      <Footer />

      <FeedbackToasts toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
