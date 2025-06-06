const express = require("express");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
const router = express.Router();

// Signup – if email is "dec@gmail.com", set role to superadmin.
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: "All fields are required!" });
    }
    const role = email === "dec@gmail.com" ? "superadmin" : "admin";
    const existing = await Admin.findOne({ email });
    if (existing) return res.status(400).json({ message: "Admin already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ name, email, password: hashedPassword, phone, role });
    await newAdmin.save();
    res.status(201).json({ message: "Admin registered successfully", email, role });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login – simple check; returns full admin details.
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: "Invalid credentials" });
    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) return res.status(400).json({ message: "Invalid credentials" });
    res.json({
      message: "Login successful",
      email: admin.email,
      role: admin.role,
      name: admin.name,
      phone: admin.phone,
      image: admin.image
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Profile – fetch admin info by email
router.get("/profile", async (req, res) => {
  try {
    const adminEmail = req.query.email;
    if (!adminEmail) return res.status(400).json({ message: "Admin email is required" });
    const admin = await Admin.findOne({ email: adminEmail });
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Profile
router.put("/update", async (req, res) => {
  try {
    const { email, name, phone, image } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    if (name) admin.name = name;
    if (phone) admin.phone = phone;
    if (image) admin.image = image;
    await admin.save();
    res.json({ message: "Profile updated successfully", admin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
