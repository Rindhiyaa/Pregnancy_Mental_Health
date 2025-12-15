import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

// Import all CSS files
import "./styles/index.css";
import "./styles/navbar.css";
import "./styles/hero.css";
import "./styles/pages.css";
import "./styles/auth.css";
import "./styles/footer.css";
import "./styles/responsive.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
