const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: String, required: true },
  location: { type: String, required: true },
  adminEmail: { type: String, required: true }  // for filtering
});

module.exports = mongoose.model("Event", eventSchema);
