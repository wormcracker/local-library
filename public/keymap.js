document.addEventListener("DOMContentLoaded", () => {
  let currentIndex = parseInt(localStorage.getItem("currentIndex")) || 0;
  let movieCards = [];
  let cardWidth = 200; // Default card width
  let containerWidth = 0; // Width of the container
  let lastUpdateTime = 0;
  const debounceTime = 100; // Debounce time for key events

  // Function to update the focus of the current card
  function updateFocus() {
    if (movieCards.length === 0) return;

    // Remove focus from all cards
    movieCards.forEach((card) => card.classList.remove("focused"));

    // Add focus to the current card
    const focusedCard = movieCards[currentIndex];
    focusedCard.classList.add("focused");

    // Ensure smooth scrolling and centering
    focusedCard.scrollIntoView({
      behavior: "smooth",
      block: "center", // Keeps it vertically centered
      inline: "center", // Keeps it horizontally centered
    });
  }

  // Function to get grid information (number of columns)
  function getGridInfo() {
    const container = document.querySelector(".files-container");
    if (!container) return { columns: 1 };

    // Get the container width and update card width if needed
    containerWidth = container.offsetWidth;
    cardWidth = movieCards[0]?.offsetWidth || 200; // Default width

    // Calculate the number of columns in the grid
    return { columns: Math.floor(containerWidth / cardWidth) || 1 };
  }

  // Function to find the closest card in the same column
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

        // Prioritize closest vertical match in the same column
        if (
          horizontalDistance < targetRect.width / 2 && // Must be in the same column
          verticalDistance < bestDistance // Choose the nearest one
        ) {
          bestDistance = verticalDistance;
          bestMatch = index;
        }
      }
    });

    return bestMatch !== -1 ? bestMatch : targetIndex; // Stay in place if no match found
  }

  // Function to handle navigation using keyboard
  function handleNavigation(event) {
    const now = Date.now();
    if (now - lastUpdateTime < debounceTime) return; // Throttle key events
    lastUpdateTime = now;

    if (movieCards.length === 0) return;

    const { columns } = getGridInfo();

    switch (event.key) {
      case "l":
      case "ArrowRight":
        if (currentIndex < movieCards.length - 1) {
          currentIndex++;
        }
        break;

      case "h":
      case "ArrowLeft":
        if (currentIndex > 0) {
          currentIndex--;
        }
        break;

      case "j":
      case "ArrowDown":
        currentIndex = findClosestInColumn(currentIndex, "down");
        break;

      case "k":
      case "ArrowUp":
        currentIndex = findClosestInColumn(currentIndex, "up");
        break;

      case "o":
      case "Enter":
        const selectedCard = movieCards[currentIndex];
        const imageContainer = selectedCard.querySelector(".image-container");
        if (imageContainer) {
          imageContainer.click(); // Simulate click to open movie
        }
        return;

      case "i":
        const selectedCardForLink = movieCards[currentIndex];
        if (!selectedCardForLink) return;

        const movieLink = selectedCardForLink.querySelector("a");
        if (movieLink) {
          window.open(movieLink.href, "_blank"); // Open IMDb link in a new tab
        }
        return;
    }

    updateFocus();

    // Save the updated currentIndex to localStorage
    localStorage.setItem("currentIndex", currentIndex);
  }

  // Function to handle mouse click on a movie card
  function handleMouseClick(event) {
    const clickedCard = event.currentTarget;
    currentIndex = movieCards.indexOf(clickedCard);
    updateFocus();

    // Save the updated currentIndex to localStorage
    localStorage.setItem("currentIndex", currentIndex);
  }

  // Setup navigation and event listeners
  function setupNavigation() {
    movieCards = Array.from(document.querySelectorAll(".card"));
    if (movieCards.length > 0) {
      updateFocus(); // Set focus on the first movie
    }

    // Add mouse hover and click event listeners using event delegation
    document
      .querySelector(".files-container")
      .addEventListener("click", (event) => {
        if (event.target.closest(".card")) {
          const clickedCard = event.target.closest(".card");
          currentIndex = movieCards.indexOf(clickedCard);
          updateFocus();
          localStorage.setItem("currentIndex", currentIndex);
        }
      });
  }

  // Attach the keydown event listener for navigation
  document.addEventListener("keydown", handleNavigation);

  // Run the setup function after the DOM content is loaded
  setTimeout(setupNavigation, 200);
});
