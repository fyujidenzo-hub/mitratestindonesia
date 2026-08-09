import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import { registerAppServiceWorker } from "./lib/push";

const isAdminEntry = window.location.pathname === "/admin" || window.location.pathname.startsWith("/admin/");
if (isAdminEntry) {
  document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.setAttribute("href", "/admin-manifest.webmanifest");
  document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-title"]')?.setAttribute("content", "Shopee Work Admin");
  document.querySelector<HTMLMetaElement>('meta[name="application-name"]')?.setAttribute("content", "Shopee Work Admin");
  document.title = "Shopee Work Admin";
}

void registerAppServiceWorker().catch(() => undefined);

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
