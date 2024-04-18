// env config
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");
const app = express();
const PORT = process.env.PORT;
connectDB();

const corsOptions = {
  origin: process.env.CLIENT_URL,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  Credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Hello");
});

app.use("/api/user",userRoutes);
app.use("/api/chat",chatRoutes);
app.use("/api/message", messageRoutes);
app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: process.env.CLIENT_URL,
  },
});

io.on("connection", (socket) => {
   console.log("connected");
    socket.on("setup", (userData) => {
       socket.join(userData._id);
       socket.emit("connected");
    });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log(`A user joined chat room: ${room}`);
  });

 socket.on("typing", (room) => {
    socket.in(room).emit("typing");
 });

 socket.on("stop typing", (room) => {
   socket.in(room).emit("stop typing");
 });

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;
    
    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;
      socket.to(user._id).emit("message received", newMessageRecieved);
    });
  });

  socket.off("setup", () =>{
    console.log("disconnected");
    socket.leave(userData._id);
  })
});
