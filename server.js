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

  socket.on("disconnect", () => {
    listeners--;

    if (listeners < 0) {
      listeners = 0;
    }

    console.log("Listener disconnected:", socket.id);
    console.log("Current listeners:", listeners);

    io.emit("listener-count", listeners);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Realtime backend running on port ${PORT}`);
});