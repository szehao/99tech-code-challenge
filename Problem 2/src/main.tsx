import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Self-hosted UI and number fonts, bundled with the app: no third-party round trips before text
// renders. Only the weights the tokens use. Fraunces loads from Google Fonts (see index.html).
import "@fontsource/sora/400.css";
import "@fontsource/sora/500.css";
import "@fontsource/sora/600.css";
import "@fontsource/dm-mono/400.css";
import "@fontsource/dm-mono/500.css";
import App from "./App";
import "./styles/global.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Missing #root element");

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
