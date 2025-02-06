
const mongoose = require('mongoose');

const ChannelSchema = new mongoose.Schema({
  channelname: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Channel", ChannelSchema);
