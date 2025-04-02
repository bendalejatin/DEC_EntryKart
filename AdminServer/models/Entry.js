const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  name: { type: String, required: true },
  flatNumber: { type: String, required: true },
  dateTime: { type: String, required: true },
  description: { type: String, required: true },
  additionalDateTime: { type: String, required: true },
  expirationDateTime: { type: Date, required: true },
  expired: { type: Boolean, default: false },
  adminEmail: { type: String, required: true }  // Added adminEmail to record owner
});

module.exports = mongoose.model('Entry', entrySchema);
