const SETTINGS = require("./settings.js");

const player = SETTINGS.PLAYER_CMD;
const mediaRootDir = SETTINGS.MEDIA_ROOT_DIR;
const showHiddenFiles = SETTINGS.SHOW_HIDDEN_FILES;
const PORT = SETTINGS.PORT;

// Cache
const metadataCache = new Map();

// Modules
const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const { existsSync } = require("fs");
const { exec } = require("child_process");
const ffmpeg = require("fluent-ffmpeg");
const { default: pLimit } = require("p-limit");

const limit = pLimit(4); // ffprobe concurrency limit

const videoExtensions = [
  ".mkv",
  ".mp4",
  ".avi",
  ".mov",
  ".wmv",
  ".flv",
  ".webm",
  ".ts",
];

const formatDuration = (seconds) => {
  if (typeof seconds !== "number" || isNaN(seconds) || seconds < 0) {
    return;
  }
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return [hrs, mins, secs].map((v) => String(v).padStart(2, "0")).join(":");
};

const isVideoFile = (filename) =>
  videoExtensions.includes(path.extname(filename).toLowerCase());

const getCachedOrScan = async (filePath, mtimeMs) => {
  const cached = metadataCache.get(filePath);
  if (cached && cached.mtimeMs === mtimeMs) return cached.data;

  const data = await scanMediaItem(filePath);
  metadataCache.set(filePath, { mtimeMs, data });
  return data;
};

const scanMediaItem = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    const isDirectory = stats.isDirectory();
    const base = {
      name: path.basename(filePath),
      path: filePath,
      createdAt: stats.birthtime,
      isDirectory,
    };

    if (isDirectory) {
      const files = await fs.readdir(filePath);
      const count = (
        await Promise.all(
          files.map(async (f) => {
            const full = path.join(filePath, f);
            try {
              const s = await fs.stat(full);
              return s.isFile() && isVideoFile(f) ? 1 : 0;
            } catch {
              return 0;
            }
          }),
        )
      ).reduce((a, b) => a + b, 0);
      return { ...base, totalEpisodes: count };
    }

    if (!isVideoFile(filePath)) return null;

    return await new Promise((resolve) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err || !metadata) return resolve(base);

        const format = metadata.format || {};
        const audioStreams = (metadata.streams || []).filter(
          (s) => s.codec_type === "audio",
        );

        resolve({
          ...base,
          mediaInfo: {
            duration: format.duration ? formatDuration(format.duration) : null,
            durationSeconds: format.duration || 0,
            audioLanguages: audioStreams.map(
              (s) => s.tags?.language?.toLowerCase() || "und",
            ),
          },
        });
      });
    });
  } catch {
    return null;
  }
};

function categorizeFile(fileObj) {
  for (const category of SETTINGS.CATEGORIES) {
    if (category.match(fileObj)) {
      return category.name;
    }
  }
  return "Uncategorized";
}

const scanDirShallow = async (dirPath) => {
  const collected = [];

  let entries;
  try {
    entries = await fs.readdir(dirPath);
  } catch (err) {
    console.error(`Failed to read directory ${dirPath}:`, err);
    return [];
  }

  for (const name of entries) {
    if (!showHiddenFiles && name.startsWith(".")) continue;

    const fullPath = path.join(dirPath, name);
    let stats;
    try {
      stats = await fs.stat(fullPath);
    } catch (err) {
      console.error(`Failed to stat ${fullPath}:`, err);
      continue;
    }

    if (isVideoFile(fullPath) || stats.isDirectory()) {
      const item = await limit(() => getCachedOrScan(fullPath, stats.mtimeMs));
      if (item) collected.push(item);
    }
  }

  return collected.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
};

const checkCategory = (dirName) => dirName.startsWith("category_");

// Server setup
const app = express();
app.use(express.static("public"));
app.use(express.json());

app.get("/files", async (req, res) => {
  const categorized = {};
  for (const cat of SETTINGS.CATEGORIES) {
    categorized[cat.name] = [];
  }

  let rootEntries;
  try {
    rootEntries = await fs.readdir(mediaRootDir);
  } catch (err) {
    return res.status(500).json({ error: "Media root not accessible." });
  }

  for (const name of rootEntries) {
    if (!showHiddenFiles && name.startsWith(".")) continue;

    const fullPath = path.join(mediaRootDir, name);
    let stats;
    try {
      stats = await fs.stat(fullPath);
    } catch {
      continue;
    }

    // If this is a category folder, scan its contents and assign to that category
    if (stats.isDirectory() && checkCategory(name)) {
      const cat = name.slice("category_".length);
      if (!categorized[cat]) categorized[cat] = [];
      const items = await scanDirShallow(fullPath);
      categorized[cat].push(...items);
      continue;
    }

    // Otherwise, treat as a regular file/folder
    const item = await limit(() => getCachedOrScan(fullPath, stats.mtimeMs));
    if (!item) continue;
    const catName = categorizeFile(item);
    if (!categorized[catName]) categorized[catName] = [];
    categorized[catName].push(item);
  }

  res.json(categorized);
});

app.post("/play", async (req, res) => {
  const { filePath } = req.body;
  if (!filePath || !existsSync(filePath)) {
    return res.status(400).json({ error: "Invalid file path" });
  }

  exec(`${player} "${filePath}"`, (err, _, stderr) => {
    if (err) {
      console.error("Player error:", stderr);
      return res.status(500).json({ error: "Failed to launch player" });
    }
    res.json({ message: "Playback started" });
  });
});

app.post("/delete", async (req, res) => {
  const { filePath } = req.body;
  if (!filePath || !existsSync(filePath)) {
    return res.status(400).json({ error: "Invalid file path" });
  }

  try {
    const stats = await fs.stat(filePath);
    if (stats.isFile()) {
      await fs.unlink(filePath);
      res.json({ message: "File deleted" });
    } else if (stats.isDirectory()) {
      await fs.rm(filePath, { recursive: true, force: true });
      res.json({ message: "Folder deleted" });
    }
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
