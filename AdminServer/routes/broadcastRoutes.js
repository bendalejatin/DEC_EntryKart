const express = require("express");
const router = express.Router();
const BroadcastMessage = require("../models/BroadcastMessage");
const Admin = require("../models/Admin");

// POST: Create a new broadcast message
router.post("/", async (req, res) => {
  try {
    const { message, broadcastType, society, flatNo, adminEmail } = req.body;
    if (!message || !broadcastType || !adminEmail) {
      return res.status(400).json({ message: "Required fields missing" });
    }
    if (broadcastType === "specific" && (!society || !flatNo)) {
      return res.status(400).json({ message: "Society and Flat No are required for specific broadcast" });
    }
    if (broadcastType === "society" && !society) {
      return res.status(400).json({ message: "Society is required for society-wide broadcast" });
    }
    const newBroadcast = new BroadcastMessage({
      message,
      broadcastType,
      society: society || null,
      flatNo: flatNo || null,
      adminEmail,
    });
    await newBroadcast.save();
    res.status(201).json(newBroadcast);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: Retrieve broadcast messages filtered by adminEmail
router.get("/", async (req, res) => {
  try {
    const adminEmail = req.query.email;
    if (!adminEmail)
      return res.status(400).json({ message: "Admin email is required" });
    const admin = await Admin.findOne({ email: adminEmail });
    let broadcasts;
    if (admin && admin.role === "superadmin") {
      broadcasts = await BroadcastMessage.find().populate("society");
    } else {
      broadcasts = await BroadcastMessage.find({ adminEmail }).populate("society");
    }
    res.json(broadcasts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// New Count Endpoint: Get count of broadcast messages
router.get("/count", async (req, res) => {
  try {
    const adminEmail = req.query.email;
    if (!adminEmail)
      return res.status(400).json({ message: "Admin email is required" });
    const admin = await Admin.findOne({ email: adminEmail });
    let count;
    if (admin && admin.role === "superadmin") {
      count = await BroadcastMessage.countDocuments();
    } else {
      count = await BroadcastMessage.countDocuments({ adminEmail });
    }
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT: Update a broadcast message by id
router.put("/:id", async (req, res) => {
  try {
    const { message, broadcastType, society, flatNo } = req.body;
    const updatedBroadcast = await BroadcastMessage.findByIdAndUpdate(
      req.params.id,
      { message, broadcastType, society: society || null, flatNo: flatNo || null },
      { new: true }
    );
    if (!updatedBroadcast) {
      return res.status(404).json({ message: "Broadcast message not found" });
    }
    res.json(updatedBroadcast);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE: Delete a broadcast message by id
router.delete("/:id", async (req, res) => {
  try {
    await BroadcastMessage.findByIdAndDelete(req.params.id);
    res.json({ message: "Broadcast message deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
