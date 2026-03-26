import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import App from "./App";

// Import all CSS files
import "./index.css";
import "./styles/navbar.css";
import "./styles/hero.css";
import "./styles/pages.css";
import "./styles/auth.css";
import "./styles/footer.css";
import "./styles/responsive.css";
import "./styles/portal-responsive.css";
import "./styles/DashboardPage.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
