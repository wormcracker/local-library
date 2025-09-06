import { websiteLink } from "./utils.js";
import { removeMovie, setMovieWatched } from "./storage.js";
import { showToast } from "../js/dom.js";

export function createOldCard(key, movieData, selectedType, reload) {
  const card = document.createElement("div");
  card.classList.add("card");
  const imageContainer = document.createElement("div");
  imageContainer.classList.add("image-container");
  card.appendChild(imageContainer);

  const moviePoster = document.createElement("img");
  moviePoster.src = movieData.i?.imageUrl || "assets/poster.jpg";
  moviePoster.alt = movieData.l;
  moviePoster.loading = "lazy";
  moviePoster.onclick = () => {
    window.open(
      `${websiteLink}${encodeURIComponent(movieData.l)}+${movieData.y}+${movieData.qid}`,
      "_blank",
    );
  };
  imageContainer.appendChild(moviePoster);

  moviePoster.onload = () => {
    moviePoster.style.opacity = "1";
  };

  const movieFeature = document.createElement("p");
  movieFeature.textContent = `${movieData.qid}`;
  movieFeature.classList.add("duration");
  imageContainer.appendChild(movieFeature);

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
  movieYear.textContent = `${movieData.y}`;
  movieDetailContainer.appendChild(movieYear);

  const movieCast = document.createElement("p");
  movieCast.textContent = `${movieData.s}`;
  movieDetailContainer.appendChild(movieCast);

  const deleteMode = document.createElement("p");
  deleteMode.classList.add("delete-button");
  deleteMode.title = "Delete";
  deleteMode.textContent = "🗑️";
  movieDetailContainer.appendChild(deleteMode);
  deleteMode.onclick = () => {
    removeMovie(key);
    showToast(`Item Deleted: ${key}`, "error");
    reload();
  };

  if (selectedType == "un") {
    const editMode = document.createElement("p");
    editMode.classList.add("edit-button");
    editMode.title = "Add to your favourite";
    editMode.textContent = "✏︎";
    movieDetailContainer.appendChild(editMode);
    editMode.onclick = () => {
      setMovieWatched(key);
      reload();
      showToast(`Item added to your favourite.`, "success");
    };
  }

  return card;
}
