import React from "react";
import { Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import SiteCliente from "./SiteCliente.jsx";
import PainelAdmin from "./PainelAdmin.jsx";

export default function App() {
  return (
    <>
      <Analytics />
      <Routes>
        <Route path="/" element={<SiteCliente />} />
        <Route path="/admin" element={<PainelAdmin />} />
      </Routes>
    </>
  );
}
