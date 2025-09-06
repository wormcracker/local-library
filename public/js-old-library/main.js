import { getAllMovies, removeMovie } from "./storage.js";
import { createOldCard } from "./cards.js";
import { showToast } from "../js/dom.js";

const container = document.querySelector(".container");
const feature = document.querySelector(".feature");
const heading = document.querySelector(".heading");
const filesContainer = document.createElement("div");
let selectedType = localStorage.getItem("selectedFilterType") || "all";
document.getElementById("typeFilter").value = selectedType;
filesContainer.classList.add("files-container");
container.appendChild(filesContainer);

document
  .getElementById("typeFilter")
  .addEventListener("change", loadCachedMovies);

function loadCachedMovies() {
  const loadingScreen = document.getElementById("loadingScreen");
  loadingScreen.style.display = "flex";
  try {
    filesContainer.innerHTML = "";
    selectedType = document.getElementById("typeFilter").value;
    localStorage.setItem("selectedFilterType", selectedType);
    const movies = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      try {
        const movie = JSON.parse(localStorage.getItem(key));
        const qid = movie?.data?.qid;
        const matchesType =
          (selectedType === "all" && movie?.watched) ||
          (selectedType === "tv" && qid?.startsWith("tv") && movie?.watched) ||
          (selectedType === "mv" &&
            qid?.startsWith("movie") &&
            movie?.watched) ||
          (selectedType === "un" && !movie?.watched);
        if (movie?.data && matchesType) {
          movies.push({
            key,
            data: movie.data,
            timestamp: movie.timestamp ?? 0,
          });
        }
      } catch (err) {}
    }
    movies.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    if (selectedType === "tv") {
      heading.innerHTML = "YOUR FAVOURITE TVSHOWS";
    } else if (selectedType === "mv") {
      heading.innerHTML = "YOUR FAVOURITE MOVIES";
    } else if (selectedType === "un") {
      heading.innerHTML = "UNWATCHED FILMS";
    } else {
      heading.innerHTML = "YOUR FAVOURITES";
    }
    let index = 0;
    const batchSize = 1;
    function renderNextBatch() {
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < batchSize && index < movies.length; i++, index++) {
        const { key, data } = movies[index];
        const card = createOldCard(key, data, selectedType, loadCachedMovies);
        card.classList.add("card-animation");
        fragment.appendChild(card);
        requestAnimationFrame(() => {
          card.classList.add("fade-in");
        });
      }
      filesContainer.appendChild(fragment);
      if (index < movies.length) {
        setTimeout(renderNextBatch, 25);
      } else {
        loadingScreen.style.display = "none";
      }
    }
    renderNextBatch();
  } catch (error) {
    showToast("Failed to load files.", "error");
    loadingScreen.style.display = "none";
  }
}

loadCachedMovies();
importExportFeature();
clearAllCache();

function exportLibrary() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const rawValue = localStorage.getItem(key);
    try {
      JSON.parse(rawValue);
      data[key] = rawValue;
    } catch (e) {
      data[key] = rawValue;
    }
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "local-library.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importLibrary(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result);
      let addedCount = 0;
      for (const key in importedData) {
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, importedData[key]);
          addedCount++;
        }
      }
      showToast(`Imported ${addedCount} new entries`, "success");
      loadCachedMovies();
    } catch (err) {
      showToast("Invalid JSON file", "error");
    }
  };
  reader.readAsText(file);
  loadCachedMovies();
  showToast("Successfully loaded movie data", "success");
}

function importExportFeature() {
  const exportDiv = document.createElement("div");
  exportDiv.innerText = "Export";
  exportDiv.classList.add("feature-all", "feature-export");
  exportDiv.onclick = () => {
    exportLibrary();
  };
  const importDiv = document.createElement("div");
  importDiv.innerText = "Import";
  importDiv.classList.add("feature-all", "feature-import");
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".json";
  fileInput.style.display = "none";
  fileInput.onchange = importLibrary;
  document.body.appendChild(fileInput);
  importDiv.onclick = () => {
    fileInput.click();
  };
  feature.appendChild(exportDiv);
  feature.appendChild(importDiv);
}

function clearAllCache() {
  const clearAll = document.createElement("div");
  clearAll.innerText = "Clear All";
  clearAll.classList.add("feature-all", "feature-clearall");
  feature.appendChild(clearAll);
  clearAll.onclick = () => {
    const confirmClear = confirm("Clear all old cache items?");
    if (!confirmClear) return;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      try {
        const value = JSON.parse(localStorage.getItem(key));
        if (value) {
          localStorage.removeItem(key);
          i = -1;
        }
      } catch (e) {}
    }
    alert("Deleted all cache entries");
    location.reload();
  };
}
