import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import axios from "axios";

const socket = io("https://pager-chat-application.onrender.com/");

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
    axios.get("https://pager-chat-application.onrender.com/chat/channels")
      .then((res) => setChannels(res.data.channels));
    
    axios.get("https://pager-chat-application.onrender.com/chat/users")
      .then((res) => {
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
       // Emit message to Socket.io
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
      console.log("Error creating channel:", error);
    }
  };

  return (
    <div className="messagecontainer">
      <div id="header">
        <h1>Pager</h1>
        <h1>Welcome, {username}</h1>
      </div>
      <div id="messagedisplay">
        <div id="usersection">
          <div id="rooms">
            <h1>Chat Rooms</h1>
            <ul>
  {channels.map((channel, index) => (
    <li
      key={index}
      onClick={() => { setSelectedChannel(channel.channelname); setSelectedUser(null); }}
      className={selectedChannel === channel.channelname ? "selected" : ""}
    >
      {channel.channelname}
    </li>
  ))}
</ul>
            <button onClick={() => setAddChannel(true)}>Add Channel</button>
            {addChannel && (
              <div id="channel">
                <input
                  type="text"
                  value={createChannel}
                  required
                  placeholder="Enter channel name..."
                  onChange={(e) => setCreateChannel(e.target.value)}
                />
                <button onClick={handleChannelCreation}>Create</button>
              </div>
            )}
          </div>
          <div id="users">
            <h2>Users</h2>
            <ul>
  {users.map((user, index) => (
    <li
      key={index}
      onClick={() => { setSelectedUser(user.username); setSelectedChannel(null); }}
      className={selectedUser === user.username ? "selected" : ""}
    >
      {user.username}
      <span style={{ color: user.isOnline ? "green" : "red", marginLeft: "10px" }}>
        {user.isOnline ? " (Online)" : " (Offline)"}
      </span>
    </li>
  ))}
</ul>
          </div>
        </div>

        {(selectedUser || selectedChannel) && (
          <div id="Messagesection">
            <h1>
              {selectedUser ? `Messaging with ${selectedUser}` : `Channel: ${selectedChannel}`}
            </h1>
            <ul id="messages">
              {messages.length > 0 ? (
                messages.map((msg, index) => (
                  <li key={index} className={msg.sender === username ? "sender" : "receiver"}>
                    <strong>{msg.sender}: </strong> {msg.message}
                  </li>
                ))
              ) : (
                <p>Start messaging...</p>
              )}
            </ul>
            <div>
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
              />
              <button onClick={handleSendMessage}>Send</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
