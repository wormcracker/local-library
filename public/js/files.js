import { extractTitle } from "./utils.js";
import { fetchMovieData } from "./api.js";
import { createCard, defaultCard, placeholderCard } from "./cards.js";
import { showToast, clearPopup, setupSearch, alertPopup } from "./dom.js";

let directCategoryLimit = 4;
let directCategoryCount = 0;

export function playFile(filePath) {
  fetch("/play", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filePath }),
  })
    .then((response) => response.json())
    .then((data) => console.log(data))
    .catch((error) => console.error("Error:", error));
}

export function deleteFile(filePath, fileName, title) {
  alertPopup(
    [
      {
        name: "Save to Favorite & Delete",
        title: "Save to your favourite list and delete the file",
      },
      { name: "Just Delete", title: "Didn't liked it? Delete the file" },
      {
        name: "Cancel",
        title: "Cancel it",
        onClick: () => {
          console.log("Canceled");
        },
      },
    ],
    `What do you want to do with ?`,
    `${title}`,
  ).then((choice) => {
    if (choice === 2) return;
    const wantToSave = choice === 0;
    const loadingScreen = document.getElementById("loadingScreen");
    loadingScreen.style.display = "flex";
    fetch("/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          alert(`Error: ${data.error}`);
        } else {
          if (!wantToSave) {
            localStorage.removeItem(title);
          } else {
            const existing = localStorage.getItem(title);
            if (existing) {
              const parsed = JSON.parse(existing);
              parsed.watched = true;
              localStorage.setItem(title, JSON.stringify(parsed));
            }
          }
          showToast(`File Deleted Successfully`, "success");
          reloadWindow();
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("An unexpected error occurred.");
      })
      .finally(() => {
        loadingScreen.style.display = "flex";
      });
  });
}

export function generateCategoryLinks(category, isMore = false) {
  // Find or create the nav containers
  let headerNav = document.getElementById("navLinks");
  if (!headerNav) {
    headerNav = document.createElement("nav");
    headerNav.className = "header-right";
    headerNav.id = "navLinks";
    document.querySelector(".header").appendChild(headerNav);
  }

  // Find or create the "More" menu
  let moreMenu = document.getElementById("moreMenu");
  if (!moreMenu) {
    moreMenu = document.createElement("div");
    moreMenu.className = "more-menu";
    moreMenu.id = "moreMenu";
    moreMenu.innerHTML = `
      <button class="more-menu-btn">More ▾</button>
      <div class="more-menu-list"></div>
    `;
    headerNav.appendChild(moreMenu);

    // Toggle menu on click
    moreMenu.querySelector(".more-menu-btn").onclick = (e) => {
      e.stopPropagation();
      moreMenu.classList.toggle("open");
    };
    // Close menu when clicking outside
    document.addEventListener("click", () => {
      moreMenu.classList.remove("open");
    });
  }

  // Create the category link
  const categoryLink = document.createElement("a");
  categoryLink.href = `#${category.toLowerCase()}`;
  categoryLink.textContent = category.toUpperCase();
  categoryLink.className = "category-link";
  categoryLink.title = `Move to ${category.toUpperCase()}`;

  if (isMore) {
    moreMenu.querySelector(".more-menu-list").appendChild(categoryLink);
  } else {
    headerNav.insertBefore(categoryLink, moreMenu);
  }
}

export function reloadWindow() {
  directCategoryCount = 0; // <-- Add this line
  let headerNav = document.getElementById("navLinks");
  if (headerNav) headerNav.innerHTML = "";
  // Remove the moreMenu if present
  let moreMenu = document.getElementById("moreMenu");
  if (moreMenu) moreMenu.remove();
  clearPopup();
  fetchFiles();
}

export async function fetchFiles() {
  directCategoryCount = 0;
  const loadingScreen = document.getElementById("loadingScreen");
  loadingScreen.style.display = "flex";
  try {
    const response = await fetch("/files");
    if (!response.ok) {
      throw new Error("Server unavailable or Invalid Folder Path");
    }
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    const container = document.getElementById("fileContainer");
    container.innerHTML = "";

    // Sorting logic
    let currentSort = localStorage.getItem("sort") || "date";
    const sortButton = document.createElement("button");
    sortButton.title = `Current Sort : Sort by ${currentSort.toUpperCase()}`;
    sortButton.classList.add("sort-button");
    sortButton.textContent =
      currentSort === "date" ? "Sort by Duration" : "Sort by Date Added";
    const headerNav = document.querySelector(".header .header-right");
    if (headerNav && !headerNav.querySelector(".sort-button")) {
      headerNav.appendChild(sortButton);
    }
    sortButton.addEventListener("click", () => {
      currentSort = currentSort === "date" ? "duration" : "date";
      localStorage.setItem("sort", currentSort);
      sortButton.textContent =
        currentSort === "date" ? "Sort by Duration" : "Sort by Date Added";
      showToast(`SORTED BY ${currentSort.toUpperCase()}`, "info");
      reloadWindow();
    });

    // Render each category dynamically
    Object.entries(data).forEach(async ([category, files]) => {
      if (files.length > 0) {
        // Create category section
        const categoryWrapper = document.createElement("div");
        const categoryName = category.toLowerCase().replace(/\s+/g, "-");
        // Generate category link in header
        if (directCategoryCount < directCategoryLimit) {
          generateCategoryLinks(category, false);
          directCategoryCount++;
        } else {
          generateCategoryLinks(category, true);
        }
        categoryWrapper.classList.add("category-wrapper");
        categoryWrapper.setAttribute("id", `${categoryName}`);
        // Category title
        const categoryTitle = document.createElement("h3");
        categoryTitle.classList.add("title");
        categoryTitle.textContent = category.toUpperCase();
        categoryWrapper.appendChild(categoryTitle);
        // Files grid
        const filesContainer = document.createElement("div");
        filesContainer.classList.add("files-container");

        // Sort files
        const sortFiles = () => {
          if (currentSort === "date") {
            files.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          } else {
            files.sort(
              (a, b) =>
                (a.mediaInfo?.durationSeconds || a.totalEpisodes || 0) -
                (b.mediaInfo?.durationSeconds || b.totalEpisodes || 0),
            );
          }
        };
        sortFiles();

        // Render cards with placeholders and animation
        async function renderFilesSequentially(files, container) {
          const placeholders = [];
          files.forEach(() => {
            placeholderCard(container, placeholders);
          });
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const cleanedTitle = extractTitle(file.name);
            const card = placeholders[i];
            try {
              const movieData = await fetchMovieData(cleanedTitle);
              card.classList.remove("placeholder");
              card.innerHTML = "";
              if (movieData) {
                createCard(
                  card,
                  movieData,
                  file.path,
                  file.name,
                  cleanedTitle,
                  file?.mediaInfo,
                  file?.totalEpisodes,
                );
              } else {
                defaultCard(
                  card,
                  cleanedTitle,
                  file.name,
                  file.path,
                  file?.mediaInfo,
                  file?.totalEpisodes,
                );
              }
            } catch (error) {
              card.classList.remove("placeholder");
              card.innerHTML = "";
              defaultCard(
                card,
                cleanedTitle,
                file.name,
                file.path,
                file?.mediaInfo,
                file?.totalEpisodes,
              );
            }
            requestAnimationFrame(() => {
              card.classList.add("card-animation", "fade-in");
            });
            await new Promise((res) => setTimeout(res, 40));
          }
        }

        categoryWrapper.appendChild(filesContainer);
        container.appendChild(categoryWrapper);
        await renderFilesSequentially(files, filesContainer);
      }
    });

    // Track all current titles for missing/unwatched logic
    const allCurrentTitles = [];
    Object.values(data).forEach((files) => {
      files.forEach((file) => {
        const cleanedTitle = extractTitle(file.name);
        allCurrentTitles.push(cleanedTitle);
      });
    });
    const lastKnownTitles =
      JSON.parse(localStorage.getItem("lastKnownFiles")) || [];
    const missingTitles = lastKnownTitles.filter(
      (title) => !allCurrentTitles.includes(title),
    );
    const unwatchedMissingTitles = [];
    for (const title of missingTitles) {
      const item = localStorage.getItem(title);
      if (!item) continue;
      const parsed = JSON.parse(item);
      if (!parsed.watched) unwatchedMissingTitles.push(title);
    }
    localStorage.setItem("lastKnownFiles", JSON.stringify(allCurrentTitles));
    loadingScreen.style.display = "none";
    promptBatchForDeletedUnwatched(unwatchedMissingTitles);
    setupSearch();
  } catch (error) {
    // Show error in the main UI
    const container = document.getElementById("fileContainer");
    container.innerHTML = `
      <div class="ui-error-message">
        <h2>⚠️ Unable to load your library</h2>
        <p style="color: red"><b>${error.message}</b></p>
        <button id="openOldLibrary">Open Cached Library</button>
      </div>
    `;
    document.getElementById("openOldLibrary").onclick = () => {
      window.location.href = "old-library.html";
    };
    showToast("Failed to load files from server.", "error");
  } finally {
    loadingScreen.style.display = "none";
  }
}

function promptBatchForDeletedUnwatched(titles) {
  if (!titles.length) return;
  clearPopup();
  const popup = document.createElement("div");
  popup.id = "alert-popup";
  const heading = document.createElement("div");
  const titleEl = document.createElement("h2");
  titleEl.innerText = "Deleted Unwatched Files Found";
  heading.appendChild(titleEl);
  const msg = document.createElement("p");
  msg.innerText = "Select which ones to save to favorites:";
  heading.appendChild(msg);
  popup.appendChild(heading);
  const form = document.createElement("form");
  form.classList.add("checkbox-list");
  const checkboxes = [];
  titles.forEach((title, i) => {
    const item = document.createElement("label");
    item.classList.add("checkbox-item");
    item.style.display = "block";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = false;
    input.value = title;
    const labelText = document.createTextNode(` ${title}`);
    item.appendChild(input);
    item.appendChild(labelText);
    form.appendChild(item);
    checkboxes.push(input);
  });
  popup.appendChild(form);
  const btnContainer = document.createElement("div");
  btnContainer.classList.add("alert-popup-buttons");
  const saveBtn = document.createElement("button");
  saveBtn.innerText = "Save Selected/Delete Other";
  saveBtn.onclick = (e) => {
    e.preventDefault();
    const selected = checkboxes
      .filter((cb) => cb.checked)
      .map((cb) => cb.value);
    const unselected = checkboxes
      .filter((cb) => !cb.checked)
      .map((cb) => cb.value);
    selected.forEach((title) => {
      const item = localStorage.getItem(title);
      if (!item) return;
      const parsed = JSON.parse(item);
      parsed.watched = true;
      localStorage.setItem(title, JSON.stringify(parsed));
    });
    unselected.forEach((title) => {
      localStorage.removeItem(title);
    });
    popup.remove();
    showToast(
      `Saved ${selected.length}, Removed ${unselected.length}`,
      "success",
    );
  };
  const cancelBtn = document.createElement("button");
  cancelBtn.innerText = "Cancel";
  cancelBtn.onclick = (e) => {
    e.preventDefault();
    popup.remove();
  };
  btnContainer.appendChild(saveBtn);
  btnContainer.appendChild(cancelBtn);
  popup.appendChild(btnContainer);
  document.body.appendChild(popup);
  requestAnimationFrame(() => popup.classList.add("show"));
}
