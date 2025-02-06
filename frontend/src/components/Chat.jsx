import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import axios from "axios";

const socket = io("https://pager-chat-application.onrender.com/", {
  withCredentials: true,  // Allow credentials like cookies to be sent
});

function Chat() {
  const [channels, setChannels] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [addChannel, setAddChannel] = useState(false);
  const [createChannel, setCreateChannel] = useState("");
  const username = localStorage.getItem("username");

  // Fetch Channels and Users
  useEffect(() => {
    axios.get("https://pager-chat-application.onrender.com/chat/channels").then((res) => setChannels(res.data.channels));
    axios.get("https://pager-chat-application.onrender.com/chat/users").then((res) => {
      setUsers(res.data.users.filter((user) => user.username !== username));
    });

    // Notify server that this user is online
    socket.emit("userConnected", username);

    return () => {
      socket.emit("userDisconnected", username);
    };
  }, []);

  // Fetch Messages for User or Channel
  useEffect(() => {
    if (selectedUser) {
      axios
        .get(`https://pager-chat-application.onrender.com/chat/messages?sender=${username}&receiver=${selectedUser}`)
        .then((res) => setMessages(res.data.messages));
    } else if (selectedChannel) {
      axios
        .get(`https://pager-chat-application.onrender.com/chat/messages?channel=${selectedChannel}`)
        .then((res) => setMessages(res.data.messages));
    }
  }, [selectedUser, selectedChannel]);

  // Listen for Real-time Messages
  useEffect(() => {
    const handleNewMessage = (newMessage) => {
      if (
        (newMessage.sender === username && newMessage.receiver === selectedUser) ||
        (newMessage.sender === selectedUser && newMessage.receiver === username) ||
        (newMessage.channel === selectedChannel)
      ) {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      }
    };

    socket.on("reply", handleNewMessage);

    return () => {
      socket.off("reply", handleNewMessage);
    };
  }, [selectedUser, selectedChannel]);

  // Send Message
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    try {
      const messageData = {
        sender: username,
        message: messageInput,
        receiver: selectedUser || null,
        channel: selectedChannel || null,
      };

      await axios.post("https://pager-chat-application.onrender.com/chat/messages", messageData);
      socket.emit("message", messageData); // Emit message to Socket.io
      setMessageInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Handle Channel Creation
  const handleChannelCreation = async () => {
    if (!createChannel.trim()) return;
    try {
      const response = await axios.post("https://pager-chat-application.onrender.com/chat/channels", { channelname: createChannel });
      setChannels([...channels, response.data.channel]);
      setCreateChannel("");
      setAddChannel(false);
    } catch (error) {
      console.error("Error creating channel:", error);
    }
  };

  return (
    <div>
      <h1>Welcome, {username}</h1>
      <div>
        <button onClick={() => setAddChannel(!addChannel)}>
          {addChannel ? "Cancel" : "Create Channel"}
        </button>
        {addChannel && (
          <div>
            <input
              type="text"
              placeholder="Channel Name"
              value={createChannel}
              onChange={(e) => setCreateChannel(e.target.value)}
            />
            <button onClick={handleChannelCreation}>Create</button>
          </div>
        )}
      </div>

      <div>
        <h2>Channels</h2>
        {channels.map((channel) => (
          <div key={channel._id}>
            <button onClick={() => setSelectedChannel(channel.channelname)}>
              {channel.channelname}
            </button>
          </div>
        ))}
      </div>

      <div>
        <h2>Users</h2>
        {users.map((user) => (
          <div key={user.username}>
            <button onClick={() => setSelectedUser(user.username)}>
              {user.username} {user.isOnline ? "(Online)" : "(Offline)"}
            </button>
          </div>
        ))}
      </div>

      <div>
        <h3>Messages</h3>
        <div>
          {messages.map((msg, index) => (
            <div key={index}>
              <strong>{msg.sender}</strong>: {msg.message}
            </div>
          ))}
        </div>
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type a message"
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
}

export default Chat;
