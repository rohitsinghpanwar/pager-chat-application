const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const app = express();
const User = require("./mongo_models/User");
const Channel = require("./mongo_models/Channel");
const Message = require("./mongo_models/Message");

dotenv.config();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://pager-chat-application.vercel.app/",
    methods: ["GET", "POST"],
    credentials: true
  },
});

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

app.use(cors(
  { origin: "https://pager-chat-application.vercel.app/", 
  methods: "GET,POST", 
  credentials: true }));
app.use(express.json());

// **🔹 Online Users Tracking**
const onlineUsers = {}; // Object to track online users

io.on("connection", (socket) => {
  console.log("A user connected");

  // When a user connects, update their online status
  socket.on("userConnected", (username) => {
    onlineUsers[username] = socket.id;
    io.emit("userStatus", { username, status: "online" }); // Notify all clients about this user's status
  });

  // When a user disconnects, update their online status
  socket.on("userDisconnected", (username) => {
    delete onlineUsers[username];
    io.emit("userStatus", { username, status: "offline" }); // Notify all clients about this user's status
  });

  socket.on("message", async ({ sender, receiver, message, channel }) => {
    const newMessage = new Message({ sender, receiver, message, channel });
    await newMessage.save();
    io.emit("reply", { sender, receiver, message, channel }); // Send message to all clients
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});
app.get("/", (req, res) => {
  res.send("Backend is up and running!");
});
// **🔹 User Signup**
app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const user = new User({ username, email, password });
    await user.save();
    res.status(200).json({ message: "Signup successful" });
  } catch (error) {
    res.status(500).json({ message: "Error signing up", error });
  }
});

// **🔹 User Login**
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || user.password !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// **🔹 Create a Channel**
app.post("/chat/channels", async (req, res) => {
  const { channelname } = req.body;
  try {
    const newChannel = new Channel({ channelname });
    await newChannel.save();
    res.status(200).json({ message: "Channel created successfully", channel: newChannel });
  } catch (error) {
    res.status(500).json({ message: "Error creating channel", error });
  }
});

// **🔹 Fetch Channels**
app.get("/chat/channels", async (req, res) => {
  try {
    const channels = await Channel.find();
    res.status(200).json({ channels });
  } catch (error) {
    res.status(500).json({ message: "Error fetching channels", error });
  }
});

// **🔹 Fetch Users**
app.get("/chat/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({
      users: users.map((user) => ({
        ...user.toObject(),
        isOnline: !!onlineUsers[user.username], // Check if the user is online
      }))
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
});

// **🔹 Send Message (Fixed)**
app.post("/chat/messages", async (req, res) => {
  const { sender, receiver, message, channel } = req.body;
  try {
    let newMessage;

    if (channel) {
      // **Save Channel Message**
      newMessage = new Message({ sender, message, channel, receiver: null });
    } else {
      // **Save Direct Message**
      newMessage = new Message({ sender, receiver, message, channel: null });
    }

    await newMessage.save();
    res.status(200).json({ message: "Message sent successfully", newMessage });

    // **Emit Message to Respective Channel or User**
    if (channel) {
      io.emit(`channel-${channel}`, newMessage); // Emit to channel
    } else {
      io.emit("reply", newMessage); // Emit for direct message
    }

  } catch (error) {
    res.status(500).json({ message: "Error sending message", error });
  }
});

// **🔹 Fetch Messages Between Users OR Channels (Fixed)**
app.get("/chat/messages", async (req, res) => {
  const { sender, receiver, channel } = req.query;
  try {
    let messages;

    if (channel) {
      // **Fetch Messages for Channel**
      messages = await Message.find({ channel }).sort({ createdAt: 1 });
    } else {
      // **Fetch Direct Messages Between Users**
      messages = await Message.find({
        $or: [
          { sender, receiver },
          { sender: receiver, receiver: sender },
        ],
      }).sort({ createdAt: 1 });
    }

    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages", error });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
