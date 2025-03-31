// Your API_KEY
const API_KEY = "_paste_your_api_here";

// Function to extract title from filename // also add if needed
function extractTitle(filename) {
  return filename
    .replace(/\.[sS]?\d{1,2}[eE]?\d{0,2}.*/g, "") // Remove season/episode info
    .replace(/\b(19|20)\d{2}\b.*/g, "") // Remove year and everything after
    .replace(/[\.\-_\()]/g, " ") // Replace dots, dashes, underscores with spaces
    .replace(
      /\b(1080p|720p|480p|BluRay|BRRip|WEB-DL|AMZN|DUAL|DDP5.1|H.264|x264|DD5.1|ESub|MoviesMod|mkvCinemas|Biz|org|mp4|Hindi|English|Korean|Esubs)\b/gi,
      "",
    ) // Remove unwanted tags
    .trim();
}

// Open file using player
function playFile(filePath) {
  fetch("/play", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filePath }),
  })
    .then((response) => response.json())
    .then((data) => console.log(data))
    .catch((error) => console.error("Error:", error));
}

// Delete file with confirmation
function deleteFile(filePath, fileName) {
  if (!confirm(`Delete File: ${fileName} ?`)) {
    return; // Cancel deletion if the user clicks "No"
  }

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
        location.reload();
      }
    })
    .catch((error) => console.error("Error:", error));
}

// Function to save data in localStorage (caching)
function saveToCache(title, data, notFound = false) {
  const cache = {
    data: data,
    not_found: notFound, // Flag to indicate if data was not found
    timestamp: new Date().getTime(),
  };
  localStorage.setItem(title, JSON.stringify(cache));
}

// Function to get cached data from localStorage
function getFromCache(title) {
  const cache = localStorage.getItem(title);
  if (!cache) return null;

  const cacheData = JSON.parse(cache);

  // If the data was previously marked as "not found", return null
  if (cacheData.not_found) {
    console.log(`Skipping API call, '${title}' was not found before.`);
    return null;
  }

  return cacheData.data;
}

// Toast message
function showToast(message, type = "info", duration = 3000) {
  const toastContainer = document.getElementById("toast-container");

  // Create toast element
  const toast = document.createElement("div");
  toast.classList.add("toast", `toast-${type}`);
  toast.innerText = message;

  // Append to container
  toastContainer.appendChild(toast);

  // Remove toast after duration
  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 500);
  }, duration);
}

// Example usage:
// showToast("File deleted successfully!", "success");
// showToast("Error deleting file!", "error");

// Function to fetch movie data from IMDb API with caching
function fetchMovieData(title, allData = false) {
  return new Promise((resolve, reject) => {
    // Check if data is in cache
    const cachedData = getFromCache(title);
    if (!allData && cachedData) {
      // console.log("Fetching from cache:", title);
      resolve(cachedData);
      return;
    }

    // If marked as "not found", don't make API request
    const cache = localStorage.getItem(title);
    if (!allData && cache && JSON.parse(cache).not_found) {
      console.log(
        `Skipping API call, '${title}' was already marked as not found.`,
      );
      reject("No data found Using Cache");
      return;
    }

    // API URL
    const url = `https://imdb-movies-web-series-etc-search.p.rapidapi.com/${title}.json`;

    // Make API request using fetch
    console.log("Fetching from API:", title);
    fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": "imdb-movies-web-series-etc-search.p.rapidapi.com",
      },
    })
      .then((response) => {
        if (response.status === 429) {
          throw new Error("Rate Limit Exceeded. Try Loading after 24 hours.");
        }
        if (response.status === 403) {
          throw new Error(
            `API request failed with status ${response.status}, Correct your API`,
          );
        }
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (allData) {
          const movieData = data.d; // Get the first movie detail from the response
          console.log("All Available data of", title, movieData);
          resolve(movieData);
        } else {
          const movieData = data.d && data.d[0]; // Get the first movie detail from the response
          if (movieData) {
            saveToCache(title, movieData);
            resolve(movieData);
          } else {
            saveToCache(title, null, true); // Mark title as "not found"
            reject("No data found using API");
          }
        }
      })
      .catch((error) => reject(error.message));
  });
}

// Popup windows for edit
function openPopupWindow(movieData, title, fileName) {
  // Remove existing popup if it exists
  let existingPopup = document.getElementById("moviePopup");
  if (existingPopup) existingPopup.remove();

  // Create the popup container
  const popup = document.createElement("div");
  popup.id = "moviePopup";

  const heading = document.createElement("h4");
  heading.textContent = `FileName: ${fileName}`;
  popup.appendChild(heading);

  // Close button
  const closeButton = document.createElement("button");
  closeButton.innerText = "close";
  closeButton.classList.add("close-button");

  // use default value
  const makeDefault = document.createElement("button");
  makeDefault.innerText = "clear";
  makeDefault.classList.add("clear-button");
  makeDefault.title = "Clear the cache";

  closeButton.addEventListener("click", function () {
    popup.remove();
  });

  makeDefault.addEventListener("click", function () {
    saveToCache(title, null, true); // Mark title as "not found"
    location.reload();
  });

  // Append the close button
  popup.appendChild(closeButton);
  popup.appendChild(makeDefault);

  // Extract and loop through movie data
  const movies = movieData || [];

  movies.forEach((singleMovieData) => {
    const card = document.createElement("div");
    card.classList.add("card");

    // Call the existing createCard function for each movie
    const movieCard = createCard(card, singleMovieData);

    // Add event listener to the card to save to cache on click
    movieCard.addEventListener("click", function () {
      saveToCache(title, singleMovieData); // Save movie data to localStorage
      location.reload();
      console.log(`Saved movie: ${title} to cache`);
    });

    popup.appendChild(movieCard);
  });

  document.body.appendChild(popup);
}

// Function to handle default value when movie data is unavailable
function defaultCard(card, cleanedTitle, name, path) {
  const imageContainer = document.createElement("div");
  imageContainer.classList.add("image-container");
  card.appendChild(imageContainer);

  const defaultPoster = document.createElement("img");
  defaultPoster.src = "assets/poster.jpg";
  defaultPoster.title = "Click to select";
  imageContainer.appendChild(defaultPoster);

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

  const deleteMode = document.createElement("p");
  deleteMode.classList.add("delete-button");
  deleteMode.title = "Delete";
  deleteMode.textContent = "🗑️";
  movieDetailContainer.appendChild(deleteMode);
  deleteMode.onclick = () => {
    deleteFile(path, name);
  };

  const editMode = document.createElement("p");
  editMode.classList.add("edit-button");
  editMode.title = "Edit";
  editMode.textContent = "✏︎";
  movieDetailContainer.appendChild(editMode);
  // Adding an event listener
  editMode.addEventListener("click", async function () {
    showToast("Editing metadata of file Wait....", "info", 1500);
    try {
      const movieData = await fetchMovieData(cleanedTitle, true);
      console.log("Fetched Movie Data:", movieData); // Debugging output

      // Ensure movie data exists
      if (movieData) {
        showToast("Sucessfully Found Data.", "success");
        openPopupWindow(movieData, cleanedTitle, name);
      } else {
        showToast("Error No Data Found ", "error");
        console.error("No Data found", error);
      }
    } catch (error) {
      showToast("Error No Data Found ", "error");
      console.error("No Data found", error);
    }
  });

  return card;
}

// Creating Dynamic Card
function createCard(card, movieData, filePath, fileName, title) {
  if (movieData.i?.imageUrl) {
    const imageContainer = document.createElement("div");
    imageContainer.classList.add("image-container");
    card.appendChild(imageContainer);

    const moviePoster = document.createElement("img");
    moviePoster.src = movieData.i.imageUrl || "assets/poster.jpg"; // Use default if missing
    moviePoster.alt = movieData.l;
    moviePoster.title = "Click to select";

    // If the image fails to load, set default
    moviePoster.onerror = () => {
      moviePoster.src = "assets/poster.jpg";
    };

    imageContainer.appendChild(moviePoster);

    if (filePath) {
      imageContainer.onclick = () => {
        playFile(filePath);
      };
    }
  }

  const movieDetailContainer = document.createElement("div");
  movieDetailContainer.classList.add("movie-detail-container");
  card.appendChild(movieDetailContainer);

  const movieTitle = document.createElement("a");
  movieTitle.href = `https://www.imdb.com/title/${movieData.id}`;
  movieTitle.title = "Open in IMDB";
  movieTitle.target = "_blank";
  movieTitle.textContent = movieData.l;
  movieDetailContainer.appendChild(movieTitle);

  const movieYear = document.createElement("p");
  movieYear.textContent = `Year: ${movieData.y} ( ${movieData.qid} ) `;
  movieDetailContainer.appendChild(movieYear);

  const movieCast = document.createElement("p");
  movieCast.textContent = `Cast: ${movieData.s}`;
  movieDetailContainer.appendChild(movieCast);

  if (filePath) {
    const deleteMode = document.createElement("p");
    deleteMode.classList.add("delete-button");
    deleteMode.title = "Delete";
    deleteMode.textContent = "🗑️";
    movieDetailContainer.appendChild(deleteMode);
    deleteMode.onclick = () => {
      deleteFile(filePath, fileName);
    };

    const editMode = document.createElement("p");
    editMode.classList.add("edit-button");
    editMode.title = "Edit";
    editMode.textContent = "✏︎";
    movieDetailContainer.appendChild(editMode);
    // Adding an event listener
    editMode.addEventListener("click", async function () {
      showToast("Editing metadata of file Wait....", "info", 1500);
      try {
        const movieData = await fetchMovieData(title, true);
        console.log("Fetched Movie Data:", movieData); // Debugging output

        // Ensure movie data exists
        if (movieData) {
          showToast("Sucessfully Found Data.", "success");
          openPopupWindow(movieData, title, fileName);
        } else {
          showToast("Error No Data Found ", "error");
          console.error("No Data found", error);
        }
      } catch (error) {
        showToast("Error No Data Found ", "error");
        console.error("Error fetching movie data for popup:", error);
      }
    });
  }
  return card;
}

// Function to fetch files and display them
async function fetchFiles() {
  const response = await fetch("/files");
  const data = await response.json();
  const container = document.getElementById("fileContainer");
  container.innerHTML = ""; // Clear previous content

  Object.entries(data).forEach(async ([category, files]) => {
    if (files.length > 0) {
      const categoryWrapper = document.createElement("div");
      const categoryName = category.toLowerCase();
      generateCategoryLinks(category);
      categoryWrapper.classList.add("category-wrapper");
      categoryWrapper.setAttribute("id", `${categoryName}`);

      const categoryTitle = document.createElement("h3");
      categoryTitle.classList.add("title");
      categoryTitle.textContent = category.toUpperCase();
      categoryWrapper.appendChild(categoryTitle);

      const filesContainer = document.createElement("div");
      filesContainer.classList.add("files-container");

      // Sort files by date added (latest first)
      files.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Process each file asynchronously
      for (const file of files) {
        const card = document.createElement("div");
        card.classList.add("card");

        // Use the cleaned-up title instead of the full filename
        const cleanedTitle = extractTitle(file.name);

        // Fetch movie data from IMDb API
        try {
          const movieData = await fetchMovieData(cleanedTitle);
          if (movieData) {
            createCard(card, movieData, file.path, file.name, cleanedTitle);
          } else {
            defaultCard(card, cleanedTitle, file.name, file.path);
          }
        } catch (error) {
          defaultCard(card, cleanedTitle, file.name, file.path);
          console.error("Error fetching movie data:", error);
        }

        filesContainer.appendChild(card);
      }

      categoryWrapper.appendChild(filesContainer);
      container.appendChild(categoryWrapper);
    }
  });
}

// Function to generate category links dynamically in the header
function generateCategoryLinks(category) {
  const headerNav = document.querySelector(".header div");
  const categoryLink = document.createElement("a");
  categoryLink.href = `#${category.toLowerCase()}`;
  categoryLink.textContent = category.toUpperCase();
  headerNav.appendChild(categoryLink);
}

// Fetch categories and files, then display them
fetchFiles();
