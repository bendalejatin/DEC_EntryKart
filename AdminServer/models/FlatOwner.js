const mongoose = require("mongoose");

const FlatOwnerSchema = new mongoose.Schema({
  societyName: { type: String, required: true },
  flatNumber: { type: String, required: true },
  ownerName: { type: String, required: true },
  profession: { type: String, required: true },
  contact: { type: String, required: true },
  email: { type: String, required: true },
  adminEmail: { type: String, required: true },
  familyMembers: [
    {
      name: { type: String, required: true },
      relation: { type: String, required: true },
      age: { type: Number, required: true },
      profession: { type: String },
      contact: { type: String }
    }
  ],
});

module.exports = mongoose.model("FlatOwner", FlatOwnerSchema);
