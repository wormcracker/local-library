import { reloadWindow } from "./files.js";
import { clearPopup } from "./dom.js";

document.addEventListener("DOMContentLoaded", () => {
  reloadWindow();
});

document.addEventListener("keydown", (e) => {
  const isSlash = e.key === "/" && !e.ctrlKey && !e.metaKey;
  const isCtrlK = (e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey);
  if (isSlash || isCtrlK) {
    e.preventDefault();
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    clearPopup();
  }
});
