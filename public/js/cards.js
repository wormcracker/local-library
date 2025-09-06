import { fetchMovieData, getFromCache } from "./api.js";
import { playFile, deleteFile } from "./files.js";
import { showToast, clearPopup, alertPopup } from "./dom.js";
import { extractTitle } from "./utils.js";

// Default card for missing data
export function defaultCard(
  card,
  cleanedTitle,
  name,
  path,
  info = null,
  totalEpisodes = null,
) {
  const imageContainer = document.createElement("div");
  imageContainer.classList.add("image-container");
  card.appendChild(imageContainer);
  const defaultPoster = document.createElement("img");
  defaultPoster.src = "assets/poster.jpg";
  defaultPoster.title = "Click to select";
  defaultPoster.loading = "lazy";
  imageContainer.appendChild(defaultPoster);
  defaultPoster.style.opacity = "1";
  imageContainer.onclick = () => {
    playFile(path);
  };
  const movieDetailContainer = document.createElement("div");
  movieDetailContainer.classList.add("movie-detail-container");
  card.appendChild(movieDetailContainer);
  const movieTitle = document.createElement("a");
  movieTitle.href = `https://www.google.com/search?q=${cleanedTitle}`;
  movieTitle.target = "_blank";
  movieTitle.textContent = cleanedTitle;
  movieDetailContainer.appendChild(movieTitle);
  const originalName = document.createElement("p");
  originalName.textContent = name;
  movieDetailContainer.appendChild(originalName);
  if (info && info.duration) {
    const duration = document.createElement("p");
    duration.classList.add("duration");
    duration.textContent = `${info?.duration}`;
    imageContainer.appendChild(duration);
  }
  if (totalEpisodes) {
    const episodes = document.createElement("p");
    episodes.classList.add("episodes");
    episodes.textContent = `${totalEpisodes}`;
    imageContainer.appendChild(episodes);
  }
  const deleteMode = document.createElement("p");
  deleteMode.classList.add("delete-button");
  deleteMode.title = "Delete";
  deleteMode.textContent = "🗑️";
  movieDetailContainer.appendChild(deleteMode);
  deleteMode.onclick = () => {
    deleteFile(path, name, cleanedTitle);
  };
  const editMode = document.createElement("p");
  editMode.classList.add("edit-button");
  editMode.title = "Edit";
  editMode.textContent = "✏︎";
  movieDetailContainer.appendChild(editMode);
  editMode.addEventListener("click", async function () {
    showToast("Editing metadata of file Wait....", "info", 1500);
    try {
      const movieData = await fetchMovieData(cleanedTitle, true);
      if (movieData) {
        showToast("Sucessfully Found Data.", "success");
        openPopupWindow(movieData, cleanedTitle, name);
      } else {
        showToast("Error No Data Found ", "error");
      }
    } catch (error) {
      showToast("Error No Data Found ", "error");
    }
  });
  return card;
}

// Card with movie data
export function createCard(
  card,
  movieData,
  filePath,
  fileName,
  title,
  info = null,
  totalEpisodes = null,
) {
  const imageContainer = document.createElement("div");
  imageContainer.classList.add("image-container");
  card.appendChild(imageContainer);
  const moviePoster = document.createElement("img");
  moviePoster.src = movieData.i?.imageUrl || "assets/poster.jpg";
  moviePoster.loading = "lazy";
  moviePoster.alt = movieData.l;
  moviePoster.title = "Click to select";
  imageContainer.appendChild(moviePoster);
  moviePoster.onerror = () => {
    moviePoster.src = "assets/poster.jpg";
    moviePoster.style.opacity = "1";
    imageContainer.classList.remove("loading");
  };
  moviePoster.onload = () => {
    moviePoster.style.opacity = "1";
  };
  if (filePath) {
    imageContainer.onclick = () => {
      playFile(filePath);
    };
  }
  const movieDetailContainer = document.createElement("div");
  movieDetailContainer.classList.add("movie-detail-container");
  card.appendChild(movieDetailContainer);
  const movieTitle = document.createElement("a");
  movieTitle.href = `https://www.imdb.com/title/${movieData?.id}`;
  movieTitle.title = "Open in IMDB";
  movieTitle.target = "_blank";
  movieTitle.textContent = movieData?.l;
  movieDetailContainer.appendChild(movieTitle);
  if (info && info.duration) {
    const duration = document.createElement("p");
    duration.classList.add("duration");
    duration.textContent = `${info?.duration}`;
    imageContainer.appendChild(duration);
  }
  if (totalEpisodes) {
    const episodes = document.createElement("p");
    episodes.classList.add("episodes");
    episodes.textContent = `${totalEpisodes}`;
    imageContainer.appendChild(episodes);
  }
  const movieYear = document.createElement("p");
  movieYear.textContent = `${movieData?.y || ""}`;
  movieDetailContainer.appendChild(movieYear);
  const movieCast = document.createElement("p");
  movieCast.textContent = `${movieData?.s}`;
  movieDetailContainer.appendChild(movieCast);
  if (filePath) {
    const deleteMode = document.createElement("p");
    deleteMode.classList.add("delete-button");
    deleteMode.title = "Delete";
    deleteMode.textContent = "🗑️";
    movieDetailContainer.appendChild(deleteMode);
    deleteMode.onclick = () => {
      deleteFile(filePath, fileName, title);
    };
    const editMode = document.createElement("p");
    editMode.classList.add("edit-button");
    editMode.title = "Edit";
    editMode.textContent = "✏︎";
    movieDetailContainer.appendChild(editMode);
    editMode.addEventListener("click", async function () {
      const loadingScreen = document.getElementById("loadingScreen");
      loadingScreen.style.display = "flex";
      showToast("Editing metadata of file Wait....", "info", 1500);
      try {
        const movieData = await fetchMovieData(title, true);
        if (movieData) {
          showToast("Sucessfully Found Data.", "success");
          openPopupWindow(movieData, title, fileName);
        } else {
          showToast("Error No Data Found ", "error");
        }
      } catch (error) {
        showToast("Error No Data Found ", "error");
      } finally {
        loadingScreen.style.display = "none";
      }
    });
  }
  return card;
}

export function placeholderCard(container, placeholders) {
  const placeholder = document.createElement("div");
  placeholder.classList.add("card", "placeholder", "fade-in");
  placeholder.innerHTML = `
      <div class="skeleton-image"></div>
      <div class="skeleton-meta-title"></div>
      <div class="skeleton-meta-year"></div>
      <div class="skeleton-meta-cast"></div>
    `;
  container.appendChild(placeholder);
  placeholders.push(placeholder);
}

// Popup window for editing metadata
export async function openPopupWindow(movieData, title, fileName) {
  const loadingScreen = document.getElementById("loadingScreen");
  loadingScreen.style.display = "flex";
  try {
    clearPopup();
    const popup = document.createElement("div");
    popup.id = "moviePopup";
    const heading = document.createElement("h4");
    heading.textContent = `FileName: ${fileName}`;
    popup.appendChild(heading);
    const searchContainer = document.createElement("div");
    const search = document.createElement("input");
    const searchbtn = document.createElement("button");
    searchContainer.classList.add("search-container");
    search.placeholder = "Title Name...";
    searchbtn.innerText = "search";
    setTimeout(() => {
      search.focus();
    }, 0);
    searchContainer.appendChild(search);
    searchContainer.appendChild(searchbtn);
    const handleSearch = async () => {
      if (search.value.trim() === "") {
        showToast("Empty value", "error");
        return;
      }
      const searchtitle = search.value;
      showToast(`Wait for title | ${searchtitle}`, "info");
      loadingScreen.style.display = "flex";
      try {
        const movieData = await fetchMovieData(searchtitle, true);
        if (movieData) {
          showToast("Successfully Found Data.", "success");
          openPopupWindow(movieData, title, fileName);
        } else {
          showToast("No Data Found", "error");
        }
      } catch (error) {
        showToast("Error fetching movie data", "error");
      } finally {
        loadingScreen.style.display = "none";
      }
    };
    searchbtn.onclick = handleSearch;
    search.addEventListener("keydown", (event) => {
      if (event.key === "Enter") handleSearch();
    });
    const closeButton = document.createElement("button");
    closeButton.innerText = "close";
    closeButton.classList.add("close-button");
    closeButton.onclick = () => {
      popup.classList.remove("show");
      setTimeout(() => popup.remove(), 300);
    };
    const makeDefault = document.createElement("button");
    makeDefault.innerText = "Default";
    makeDefault.classList.add("clear-button");
    makeDefault.title = "Revoke to default theme";
    makeDefault.onclick = () => {
      localStorage.setItem(title, JSON.stringify({ not_found: true }));
      location.reload();
    };
    popup.appendChild(closeButton);
    popup.appendChild(makeDefault);
    popup.appendChild(searchContainer);
    const movies = movieData || [];
    if (Object.keys(movies).length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.textContent = "No content found. Please search the title...";
      emptyMessage.classList.add("no-content-message");
      popup.appendChild(emptyMessage);
    } else {
      for (const singleMovieData of movies) {
        const card = document.createElement("div");
        card.classList.add("card");
        const movieCard = createCard(card, singleMovieData);
        const imageSelector = movieCard.querySelector("img");
        imageSelector.addEventListener("click", function () {
          const oldData = getFromCache(title);
          if (JSON.stringify(oldData) !== JSON.stringify(singleMovieData)) {
            localStorage.setItem(
              title,
              JSON.stringify({
                data: singleMovieData,
                watched: false,
                not_found: false,
                timestamp: new Date().getTime(),
              }),
            );
            setTimeout(() => location.reload(), 300);
            showToast(`Updated | ${title}`, "success");
          }
          closeButton.click();
        });
        popup.appendChild(movieCard);
      }
    }
    document.body.appendChild(popup);
    requestAnimationFrame(() => {
      popup.classList.add("show");
    });
  } catch (err) {
    showToast("Error opening popup", "error");
  } finally {
    loadingScreen.style.display = "none";
  }
}
