const keyboardNav = document.querySelector(".keyboard-nav");

// On page load, check if stored value allows keyboard nav
const useKeyboard = localStorage.getItem("usekeyboard") === "true";
if (keyboardNav) keyboardNav.checked = useKeyboard;

// Only run the script if stored value is "true"
if (useKeyboard) {
  activateKeyboardNavigation();
}

// Listen for CTRL+K to toggle
document.addEventListener("keydown", (e) => {
  const isCtrlj = e.key.toLowerCase() === "j" && (e.ctrlKey || e.metaKey);

  if (isCtrlj) {
    e.preventDefault(); // Stop browser default action like search

    if (!keyboardNav) return;

    // Toggle checkbox manually
    keyboardNav.checked = !keyboardNav.checked;

    // Save the new state
    localStorage.setItem("usekeyboard", keyboardNav.checked);

    // Reload page to apply change
    window.location.reload();
  }
});
// Listen for checkbox changes
if (keyboardNav) {
  keyboardNav.addEventListener("change", (event) => {
    const isChecked = event.target.checked;
    localStorage.setItem("usekeyboard", isChecked);

    // Reload page to apply the setting immediately
    window.location.reload();
  });
}

// Your main keyboard navigation code in a function
function activateKeyboardNavigation() {
  document.addEventListener("DOMContentLoaded", () => {
    let currentIndex = parseInt(localStorage.getItem("currentIndex")) || 0;
    let movieCards = [];
    let cardWidth = 200;
    let containerWidth = 0;
    let lastUpdateTime = 0;
    const debounceTime = 100;
    let selectedCard;

    function updateFocus() {
      if (movieCards.length === 0) return;
      movieCards.forEach((card) => card.classList.remove("focused"));
      const focusedCard = movieCards[currentIndex];
      if (!focusedCard) return;
      focusedCard.classList.add("focused");
      focusedCard.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }

    function getGridInfo() {
      const container = document.querySelector(".files-container");
      if (!container) return { columns: 1 };
      containerWidth = container.offsetWidth;
      cardWidth = movieCards[0]?.offsetWidth || 200;
      return { columns: Math.floor(containerWidth / cardWidth) || 1 };
    }

    function findClosestInColumn(targetIndex, direction) {
      const targetRect = movieCards[targetIndex].getBoundingClientRect();
      let bestMatch = -1;
      let bestDistance = Infinity;

      movieCards.forEach((card, index) => {
        if (index === targetIndex) return;
        const rect = card.getBoundingClientRect();
        const isAbove = rect.bottom <= targetRect.top;
        const isBelow = rect.top >= targetRect.bottom;

        if (
          (direction === "up" && isAbove) ||
          (direction === "down" && isBelow)
        ) {
          const horizontalDistance = Math.abs(targetRect.left - rect.left);
          const verticalDistance = Math.abs(targetRect.top - rect.top);

          if (
            horizontalDistance < targetRect.width / 2 &&
            verticalDistance < bestDistance
          ) {
            bestDistance = verticalDistance;
            bestMatch = index;
          }
        }
      });

      return bestMatch !== -1 ? bestMatch : targetIndex;
    }

    function handleNavigation(event) {
      const now = Date.now();
      if (now - lastUpdateTime < debounceTime) return;
      lastUpdateTime = now;

      if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA" ||
        event.target.isContentEditable
      )
        return;

      if (movieCards.length === 0) return;

      const { columns } = getGridInfo();

      switch (event.key) {
        case "l":
        case "ArrowRight":
          if (currentIndex < movieCards.length - 1) currentIndex++;
          break;

        case "h":
        case "ArrowLeft":
          if (currentIndex > 0) currentIndex--;
          break;

        case "j":
        case "ArrowDown":
          currentIndex = findClosestInColumn(currentIndex, "down");
          break;

        case "k":
        case "ArrowUp":
          currentIndex = findClosestInColumn(currentIndex, "up");
          break;

        case "e":
          selectedCard = movieCards[currentIndex];
          selectedCard?.querySelector(".edit-button")?.click();
          return;

        case "d":
          selectedCard = movieCards[currentIndex];
          selectedCard?.querySelector(".delete-button")?.click();
          return;

        case "s":
          document.querySelector(".sort-button")?.click();
          return;

        case "o":
        case "Enter":
          selectedCard = movieCards[currentIndex];
          selectedCard?.querySelector(".image-container")?.click();
          return;

        case "i":
          const selectedCardForLink = movieCards[currentIndex];
          if (!selectedCardForLink) return;
          const movieLink = selectedCardForLink.querySelector("a");
          if (movieLink) window.open(movieLink.href, "_blank");
          return;
      }

      updateFocus();
      localStorage.setItem("currentIndex", currentIndex);
    }

    function setupNavigation() {
      movieCards = Array.from(document.querySelectorAll(".card"));
      if (movieCards.length > 0) updateFocus();

      document
        .querySelector(".files-container")
        .addEventListener("click", (event) => {
          const clickedCard = event.target.closest(".card");
          if (clickedCard) {
            currentIndex = movieCards.indexOf(clickedCard);
            updateFocus();
            localStorage.setItem("currentIndex", currentIndex);
          }
        });
    }

    document.addEventListener("keydown", handleNavigation);

    setTimeout(setupNavigation, 500);
  });
}
