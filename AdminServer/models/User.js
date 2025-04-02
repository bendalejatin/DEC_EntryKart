const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  flatNumber: { type: String, required: true },
  society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  adminEmail: { type: String, required: true },
  profession: { type: String } // New field for profession
});

module.exports = mongoose.model("User", userSchema);
