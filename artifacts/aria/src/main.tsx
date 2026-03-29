import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";

// Apply stored theme before first render to avoid flash
const stored = localStorage.getItem("aria-theme");
if (stored === "purple") document.documentElement.classList.add("purple-theme");

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
