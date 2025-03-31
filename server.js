// change the video player detail (defaul os: macOs and default player: MPV)
const player = "open -a mpv -F --args -fs";

// Available files directories // change according to your directory
const directories = {
  hindi: "/Volumes/External_Main_Drive/Movies/Hindi/",
  nonHindi: "/Volumes/External_Main_Drive/Movies/NonHindi/",
  old: "/Volumes/External_Main_Drive/Movies/Old/",
  tvShows: "/Volumes/External_Main_Drive/Series/",
};

// show/hide hidden(.) file in directory
const showHiddenFiles = false;

// Change uncommon port if already acquired
const PORT = 3000;

// server
const express = require("express");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const app = express();

// Serve static frontend files
app.use(express.static("public"));

// Function to scan a directory and get file names with timestamps
const getFiles = (dirPath, showHidden) => {
  if (!fs.existsSync(dirPath)) return [];

  return fs
    .readdirSync(dirPath)
    .filter((file) => showHidden || !file.startsWith("."))
    .map((file) => {
      const filePath = path.join(dirPath, file);
      return {
        name: file,
        path: filePath,
        createdAt: fs.statSync(filePath).birthtime, // File creation time
        isDirectory: fs.statSync(filePath).isDirectory(),
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by date added
};

// API to get all categorized files
app.get("/files", (req, res) => {
  const result = {};

  for (const [key, dirPath] of Object.entries(directories)) {
    result[key] = getFiles(dirPath, showHiddenFiles);
  }

  res.json(result);
});

// API to play a file with MPV
app.post("/play", express.json(), (req, res) => {
  const { filePath } = req.body;

  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(400).json({ error: "Invalid file path" });
  }

  const command = `${player} "${filePath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error launching MPV: ${stderr}`);
      return res.status(500).json({ error: "Failed to launch player" });
    }
  });
});

// API to play a file with MPV
app.post("/delete", express.json(), (req, res) => {
  const { filePath } = req.body;

  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(400).json({ error: "Invalid file path" });
  }

  try {
    const stats = fs.statSync(filePath);

    if (stats.isFile()) {
      // Delete file
      fs.unlinkSync(filePath);
      return res.json({ message: "File deleted successfully" });
    } else if (stats.isDirectory()) {
      // Delete folder recursively
      fs.rmSync(filePath, { recursive: true, force: true });
      return res.json({ message: "Folder deleted successfully" });
    }
  } catch (error) {
    console.error("Error deleting:", error);
    return res.status(500).json({ error: "Failed to delete file/folder" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
