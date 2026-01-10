import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// AQUÍ ESTÁ EL CAMBIO: Vinculamos tu nuevo archivo
import "./global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
