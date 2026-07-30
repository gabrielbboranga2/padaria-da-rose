import React from "react";
import { Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import SiteCliente from "./SiteCliente.jsx";
import PainelAdmin from "./PainelAdmin.jsx";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
          background: "#FFF8F0", fontFamily: "'Inter', sans-serif", padding: 24, textAlign: "center"
        }}>
          <div>
            <p style={{ fontSize: "2rem", marginBottom: 12 }}>🍞</p>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#1C0A00", marginBottom: 8 }}>Algo deu errado</h2>
            <p style={{ fontSize: "0.92rem", color: "#7A6B5D", marginBottom: 20, maxWidth: 400 }}>
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            <button onClick={() => { this.setState({ hasError: false }); window.location.href = "/"; }}
              style={{
                padding: "12px 28px", borderRadius: 12, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, #F59E0B, #F97316)", color: "#FFF",
                fontWeight: 700, fontSize: "0.95rem", boxShadow: "0 6px 20px rgba(245,158,11,0.3)"
              }}>
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <Analytics />
      <Routes>
        <Route path="/" element={<SiteCliente />} />
        <Route path="/admin" element={<PainelAdmin />} />
      </Routes>
    </ErrorBoundary>
  );
}
