// API and caching logic

import { SETTINGS } from "./settings.js";

export const API_KEY = SETTINGS.API_KEY;

export function saveToCache(title, data, notFound = false) {
  const cache = {
    data: data,
    watched: false,
    not_found: notFound,
    timestamp: new Date().getTime(),
  };
  localStorage.setItem(title, JSON.stringify(cache));
}

export function getFromCache(title) {
  const cache = localStorage.getItem(title);
  if (!cache) return null;
  const cacheData = JSON.parse(cache);
  if (cacheData.not_found) return null;
  return cacheData.data;
}

export function fetchMovieData(title, allData = false) {
  return new Promise((resolve, reject) => {
    const cachedData = getFromCache(title);
    if (!allData && cachedData) {
      resolve(cachedData);
      return;
    }
    const cache = localStorage.getItem(title);
    if (!allData && cache && JSON.parse(cache).not_found) {
      reject("No data found Using Cache");
      return;
    }
    const url = `https://imdb-movies-web-series-etc-search.p.rapidapi.com/${title}.json`;
    fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": "imdb-movies-web-series-etc-search.p.rapidapi.com",
      },
    })
      .then((response) => {
        if (response.status === 429)
          throw new Error("Rate Limit Exceeded. Try Loading after 24 hours.");
        if (response.status === 403)
          throw new Error(
            `API request failed with status ${response.status}, Correct your API`,
          );
        if (!response.ok)
          throw new Error(`API request failed with status ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (allData) {
          resolve(data.d);
        } else {
          const movieData = data.d && data.d[0];
          if (movieData) {
            saveToCache(title, movieData);
            resolve(movieData);
          } else {
            saveToCache(title, null, true);
            reject("No data found using API");
          }
        }
      })
      .catch((error) => reject(error.message));
  });
}
