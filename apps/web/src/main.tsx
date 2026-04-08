// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { NoCursorWrapper } from "./components/NoCursorWrapper"; // 👈 import do wrapper
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NoCursorWrapper> 
          <App />
        </NoCursorWrapper>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);