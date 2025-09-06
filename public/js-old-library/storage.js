// Handles reading/writing to localStorage for old-library

export function getAllMovies() {
  const movies = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    try {
      const movie = JSON.parse(localStorage.getItem(key));
      movies.push({ key, movie });
    } catch (err) {
      // skip invalid
    }
  }
  return movies;
}

export function removeMovie(key) {
  localStorage.removeItem(key);
}

export function setMovieWatched(key) {
  let storedMovie = localStorage.getItem(key);
  if (storedMovie) {
    let parsedMovie = JSON.parse(storedMovie);
    parsedMovie.watched = true;
    localStorage.setItem(key, JSON.stringify(parsedMovie));
  }
}
