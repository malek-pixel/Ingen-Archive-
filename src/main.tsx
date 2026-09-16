import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/base.css";
import "./styles/level5.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root mount node");

createRoot(root).render(
  <StrictMode>
    {/* Opt in to the v7 behaviours now: both are already how this app expects
        to work, and leaving them off logs a deprecation warning on every load. */}
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </StrictMode>
);
