const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

app.use(
  cors({
    origin: "*",
  })
);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let listeners = 0;
let songCounts = {}; // { songId: countOfPeopleListening }
let socketSongs = {}; // { socketId: songId }

app.get("/", (req, res) => {
  console.log("Root route hit!");
  res.json({
    status: "online",
    listeners: listeners,
  });
});

io.on("connection", (socket) => {
  listeners++;
  console.log("Listener connected:", socket.id);
  console.log("Current listeners:", listeners);
  io.emit("listener-count", listeners);

  socket.on("song-playing", (songId) => {
    // If this socket was already counted for a different song, remove it from there first
    const previousSong = socketSongs[socket.id];
    if (previousSong && songCounts[previousSong]) {
      songCounts[previousSong]--;
      if (songCounts[previousSong] <= 0) {
        delete songCounts[previousSong];
      }
    }

    socketSongs[socket.id] = songId;
    songCounts[songId] = (songCounts[songId] || 0) + 1;

    io.emit("song-counts", songCounts);
  });

  socket.on("song-paused", () => {
    const currentSong = socketSongs[socket.id];
    if (currentSong && songCounts[currentSong]) {
      songCounts[currentSong]--;
      if (songCounts[currentSong] <= 0) {
        delete songCounts[currentSong];
      }
    }

    delete socketSongs[socket.id];
    io.emit("song-counts", songCounts);
  });

  socket.on("disconnect", () => {
    listeners--;
    if (listeners < 0) {
      listeners = 0;
    }
    console.log("Listener disconnected:", socket.id);
    console.log("Current listeners:", listeners);
    io.emit("listener-count", listeners);

    const currentSong = socketSongs[socket.id];
    if (currentSong && songCounts[currentSong]) {
      songCounts[currentSong]--;
      if (songCounts[currentSong] <= 0) {
        delete songCounts[currentSong];
      }
    }
    delete socketSongs[socket.id];
    io.emit("song-counts", songCounts);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Realtime backend running on port ${PORT}`);
});