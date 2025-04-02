const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const Admin = require("../models/Admin");

// Create Event – expects adminEmail in the request body.
router.post("/", async (req, res) => {
  try {
    const { title, description, date, location, adminEmail } = req.body;
    if (!adminEmail)
      return res.status(400).json({ message: "Admin email is required" });
    const event = new Event({ title, description, date, location, adminEmail });
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Events – filter by adminEmail (unless superadmin)
router.get("/", async (req, res) => {
  try {
    const adminEmail = req.query.email;
    if (!adminEmail)
      return res.status(400).json({ message: "Admin email is required" });
    const admin = await Admin.findOne({ email: adminEmail });
    let events;
    if (admin && admin.role === "superadmin") {
      events = await Event.find();
    } else {
      events = await Event.find({ adminEmail });
    }
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Count Events for Dashboard
router.get("/count", async (req, res) => {
  try {
    const adminEmail = req.query.email;
    if (!adminEmail)
      return res.status(400).json({ message: "Admin email is required" });
    const admin = await Admin.findOne({ email: adminEmail });
    const count = admin && admin.role === "superadmin"
      ? await Event.countDocuments()
      : await Event.countDocuments({ adminEmail });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete and Update routes remain unchanged.
router.delete("/:id", async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { title, description, date, location } = req.body;
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { title, description, date, location },
      { new: true }
    );
    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
