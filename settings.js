// settings.js (Common config for both server and client)

const SETTINGS = {
  // API key: GO TO : public/js/settings.js

  // For keyboard navigation:
  // ctrl+j to toggle keyboard navigation
  // arrowKeys || h,j,k,l => for left, right, up, down
  // o => to open files in your player
  // d => delete the file
  // s => change the sort setting
  // e => to edit
  // i => to open imdb link
  // / || ctrl + K => to search

  // Server settings
  PLAYER_CMD: "open -a mpv -F --args -fs",
  MEDIA_ROOT_DIR: "/home/movies/",
  SHOW_HIDDEN_FILES: false,
  PORT: 3000,

  // Flexible categorization rules // do not name with spaces
  CATEGORIES: [
    {
      name: "Nepali",
      match: (fileObj) =>
        fileObj.mediaInfo?.audioLanguages?.some((l) =>
          ["np"].includes(l.toLowerCase()),
        ),
    },
    {
      name: "Hindi",
      match: (fileObj) =>
        fileObj.mediaInfo?.audioLanguages?.some((l) =>
          ["hi", "hin"].includes(l.toLowerCase()),
        ),
    },
    {
      name: "TVShows",
      match: (fileObj) => fileObj.isDirectory,
    },
    {
      name: "Other",
      match: (fileObj) => true, // fallback category
    },
  ],
};

module.exports = SETTINGS;
