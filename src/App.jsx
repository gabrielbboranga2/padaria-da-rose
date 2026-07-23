import React from "react";
import { Routes, Route } from "react-router-dom";
import SiteCliente from "./SiteCliente.jsx";
import PainelAdmin from "./PainelAdmin.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SiteCliente />} />
      <Route path="/admin" element={<PainelAdmin />} />
    </Routes>
  );
}
