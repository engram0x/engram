import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";
import Landing from "./pages/Landing";
import AppPage from "./pages/App";
import Protocol from "./pages/Protocol";
import Token from "./pages/Token";
import Vision from "./pages/Vision";
import Terminal from "./pages/Terminal";
import "./index.css";

// HashRouter keeps client-side routing working on static hosts (GitHub Pages)
// without server rewrites.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WalletProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app" element={<AppPage />} />
          <Route path="/protocol" element={<Protocol />} />
          <Route path="/token" element={<Token />} />
          <Route path="/vision" element={<Vision />} />
          <Route path="/terminal" element={<Terminal />} />
        </Routes>
      </HashRouter>
    </WalletProvider>
  </React.StrictMode>
);
