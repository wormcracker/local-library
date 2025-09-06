// DOM utilities: popup, toast, search, etc.

export function showToast(message, type = "info", duration = 3000) {
  const toastContainer = document.getElementById("toast-container");
  toastContainer.innerHTML = "";
  const toast = document.createElement("div");
  toast.classList.add("toast", `toast-${type}`);
  toast.innerText = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("fade-in");
  }, 0);
  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 500);
  }, duration);
}

export function alertPopup(
  buttons = [{ name: "Yes" }, { name: "No" }],
  messageHeading = "Choose any button!",
  messageParagraph = null,
) {
  return new Promise((resolve) => {
    clearPopup();
    const popup = document.createElement("div");
    popup.id = "alert-popup";
    const alertHeading = document.createElement("div");
    const msgHeading = document.createElement("h2");
    msgHeading.innerText = messageHeading;
    alertHeading.appendChild(msgHeading);
    if (messageParagraph) {
      const msgPara = document.createElement("p");
      msgPara.innerText = messageParagraph;
      alertHeading.appendChild(msgPara);
    }
    const btnContainer = document.createElement("div");
    btnContainer.classList.add("alert-popup-buttons");
    buttons.forEach((btn, idx) => {
      const button = document.createElement("button");
      button.innerText = btn.name || `Button ${idx + 1}`;
      button.id = btn.id || `popupBtn${idx}`;
      if (btn.className) button.className = btn.className;
      if (btn.title) button.title = btn.title;
      if (btn.style) button.style = btn.style;
      button.onclick = () => {
        if (typeof btn.onClick === "function") btn.onClick();
        popup.remove();
        resolve(idx);
      };
      btnContainer.appendChild(button);
    });
    popup.appendChild(alertHeading);
    popup.appendChild(btnContainer);
    requestAnimationFrame(() => {
      popup.classList.add("show");
    });
    document.body.appendChild(popup);
  });
}

export function clearPopup() {
  const existingAlertPopup = document.getElementById("alert-popup");
  if (existingAlertPopup) existingAlertPopup.remove();
  const existingPopup = document.getElementById("moviePopup");
  if (existingPopup) existingPopup.remove();
  const searchInput = document.getElementById("searchInput");
  if (searchInput) searchInput.blur();
}

export function setupSearch() {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;
  let debounceTimeout;
  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      const query = searchInput.value.toLowerCase();
      const allCards = document.querySelectorAll(".files-container .card");
      allCards.forEach((card) => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) ? "block" : "none";
      });
    }, 150);
  });
}
