const express = require('express');
const Entry = require('../models/Entry');
const Admin = require('../models/Admin'); // To check admin role
const router = express.Router();
const cron = require('node-cron');

// Helper: Returns a filter based on the admin's role
const getAdminAndFilterEntries = async (adminEmail) => {
  if (!adminEmail) throw new Error("Admin email is required");
  const admin = await Admin.findOne({ email: adminEmail });
  if (!admin) throw new Error("Admin not found");
  // If superadmin, return an empty filter (i.e. no restriction)
  return admin.role === "superadmin" ? {} : { adminEmail };
};

// Create Entry

// GET Entry Count
router.get('/count', async (req, res) => {
    try {
      const { email } = req.query;
      if (!email) {
        return res.status(400).json({ error: "Admin email is required" });
      }
  
      // Find the admin to check their role
      const admin = await Admin.findOne({ email });
      let filter = {};
      // If not a superadmin, filter by adminEmail
      if (admin && admin.role !== "superadmin") {
        filter = { adminEmail: email };
      }
  
      const count = await Entry.countDocuments(filter);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
router.post('/', async (req, res) => {
  try {
    const { name, flatNumber, dateTime, description, additionalDateTime, adminEmail } = req.body;
    if (!adminEmail) return res.status(400).json({ error: "Admin email is required" });

    // Set expiration 7 days after the provided dateTime
    const expirationDateTime = new Date(dateTime);
    expirationDateTime.setDate(expirationDateTime.getDate() + 7);

    const newEntry = new Entry({ 
      name, 
      flatNumber, 
      dateTime, 
      description, 
      additionalDateTime, 
      expirationDateTime,
      adminEmail
    });

    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Entries (filtering by name, flatNumber, date, and admin ownership)
router.get('/', async (req, res) => {
  try {
    const { name, flatNumber, date, email } = req.query;
    let query = {};

    if (name) query.name = new RegExp(name, 'i');
    if (flatNumber) query.flatNumber = new RegExp(flatNumber, 'i');
    if (date) query.dateTime = { $regex: date, $options: 'i' };

    if (email) {
      const adminFilter = await getAdminAndFilterEntries(email);
      query = { ...query, ...adminFilter };
    }
    
    const entries = await Entry.find(query);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Entry
router.put('/:id', async (req, res) => {
  try {
    const updatedEntry = await Entry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedEntry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Entry
router.delete('/:id', async (req, res) => {
  try {
    await Entry.findByIdAndDelete(req.params.id);
    res.json({ message: "Entry deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cron Job: Mark entries as expired (runs daily at midnight)
cron.schedule('0 0 * * *', async () => {
  const now = new Date();
  await Entry.updateMany({ expirationDateTime: { $lt: now } }, { expired: true });
  console.log("Expired permissions updated");
});

// Get Expiring Soon Entries (notify 3 days before expiry)
router.get('/expiring-soon', async (req, res) => {
  try {
    const now = new Date();
    const upcomingExpiration = new Date();
    upcomingExpiration.setDate(now.getDate() + 3);
    
    const expiringEntries = await Entry.find({
      expirationDateTime: { $gte: now, $lte: upcomingExpiration },
      expired: false
    });
    
    res.json(expiringEntries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
