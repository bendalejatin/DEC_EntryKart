const express = require("express");
const router = express.Router();
const Coupon = require("../models/Coupon");
const Admin = require("../models/Admin");
const User = require("../models/User");
const QRCode = require("qrcode");

// Helper function to generate a unique coupon code
const generateUniqueCode = async (baseCode) => {
  let uniqueCode = baseCode;
  let exists = await Coupon.findOne({ code: uniqueCode });
  while (exists) {
    uniqueCode = `${baseCode}-${Math.floor(Math.random() * 10000)}`;
    exists = await Coupon.findOne({ code: uniqueCode });
  }
  return uniqueCode;
};

// Create Coupon – supports single coupon or all flats generation.
router.post("/", async (req, res) => {
  try {
    const { societyId, flatNo, userName, code, expiryDate, eventId, adminEmail, generateForAllFlats, flats } = req.body;
    if (!adminEmail)
      return res.status(400).json({ message: "Admin email is required" });
    if (!societyId || !eventId)
      return res.status(400).json({ message: "Both societyId and eventId are required" });

    if (generateForAllFlats) {
      if (!flats || !Array.isArray(flats) || flats.length === 0) {
        return res.status(400).json({ message: "Flats array is required for generating all flats coupons" });
      }
      let couponsArray = [];
      for (let flat of flats) {
        const userObj = await User.findOne({ society: societyId, flatNumber: flat });
        const foundUserName = userObj ? userObj.name : "";
        const baseCode = `${code}-${flat.replace(/\s+/g, "")}`;
        const uniqueCode = await generateUniqueCode(baseCode);
        const couponData = new Coupon({
          society: societyId,
          flatNo: flat,
          userName: foundUserName,
          code: uniqueCode,
          expiryDate,
          event: eventId,
          adminEmail,
          status: "active",
          used: false
        });
        const couponObj = await couponData.save();
        const qrData = JSON.stringify({
          couponId: couponObj._id,
          code: couponObj.code,
          flatNo: couponObj.flatNo,
          userName: couponObj.userName,
          status: couponObj.status,
        });
        const qrCodeDataUrl = await QRCode.toDataURL(qrData);
        couponObj.qrCode = qrCodeDataUrl;
        await couponObj.save();
        couponsArray.push(couponObj);
      }
      return res.status(201).json(couponsArray);
    } else {
      const baseCode = code;
      const uniqueCode = await generateUniqueCode(baseCode);
      const coupon = new Coupon({
        society: societyId,
        flatNo,
        userName,
        code: uniqueCode,
        expiryDate,
        event: eventId,
        adminEmail,
        status: "active",
        used: false
      });
      const couponObj = await coupon.save();
      const qrData = JSON.stringify({
        couponId: couponObj._id,
        code: couponObj.code,
        flatNo: couponObj.flatNo,
        userName: couponObj.userName,
        status: couponObj.status,
      });
      const qrCodeDataUrl = await QRCode.toDataURL(qrData);
      couponObj.qrCode = qrCodeDataUrl;
      await couponObj.save();
      res.status(201).json(couponObj);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Coupon
router.put("/:id", async (req, res) => {
  try {
    const { societyId, flatNo, userName, code, expiryDate, eventId, adminEmail } = req.body;
    if (!adminEmail)
      return res.status(400).json({ message: "Admin email is required" });
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { society: societyId, flatNo, userName, code, expiryDate, event: eventId, adminEmail },
      { new: true }
    );
    if (!updatedCoupon) return res.status(404).json({ message: "Coupon not found" });
    res.json(updatedCoupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Coupon
router.delete("/:id", async (req, res) => {
  try {
    const deletedCoupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!deletedCoupon) return res.status(404).json({ message: "Coupon not found" });
    res.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Coupons for Dashboard
router.get("/", async (req, res) => {
  try {
    const adminEmail = req.query.email;
    if (!adminEmail) return res.status(400).json({ message: "Admin email is required" });
    const admin = await Admin.findOne({ email: adminEmail });
    let coupons;
    if (admin && admin.role === "superadmin") {
      coupons = await Coupon.find().populate("society event");
    } else {
      coupons = await Coupon.find({ adminEmail }).populate("society event");
    }
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Count Coupons for Dashboard.
router.get("/count", async (req, res) => {
  try {
    const adminEmail = req.query.email;
    if (!adminEmail) return res.status(400).json({ message: "Admin email is required" });
    const admin = await Admin.findOne({ email: adminEmail });
    const count = admin && admin.role === "superadmin"
      ? await Coupon.countDocuments()
      : await Coupon.countDocuments({ adminEmail });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----- Scanning Endpoints -----

// Mobile scan endpoint – called automatically when a mobile QR scanner opens the URL.
// This updates the coupon's status to "used" (if not expired).
router.get("/scan/mobile/:code", async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ code: req.params.code }).populate("society event");
    if (!coupon) return res.status(404).json({ coupon: null });
    const today = new Date().toISOString().split("T")[0];
    if (coupon.expiryDate < today) {
      coupon.status = "expired";
      await coupon.save();
      return res.json({ coupon: {
        qrCodeId: coupon._id,
        code: coupon.code,
        userName: coupon.userName,
        flatNo: coupon.flatNo,
        society: coupon.society ? coupon.society.name : "",
        event: coupon.event ? coupon.event.title : "",
        expiryDate: coupon.expiryDate,
        status: coupon.status,
        used: coupon.used ? "Yes" : "No",
        active: coupon.status === "active" ? "Yes" : "No"
      }});
    }
    if (!coupon.used) {
      coupon.used = true;
      coupon.status = "used";
      await coupon.save();
      return res.json({ coupon: {
        qrCodeId: coupon._id,
        code: coupon.code,
        userName: coupon.userName,
        flatNo: coupon.flatNo,
        society: coupon.society ? coupon.society.name : "",
        event: coupon.event ? coupon.event.title : "",
        expiryDate: coupon.expiryDate,
        status: "used",
        used: "Yes",
        active: "No",
        firstScan: true
      }});
    } else {
      return res.json({ coupon: {
        qrCodeId: coupon._id,
        code: coupon.code,
        userName: coupon.userName,
        flatNo: coupon.flatNo,
        society: coupon.society ? coupon.society.name : "",
        event: coupon.event ? coupon.event.title : "",
        expiryDate: coupon.expiryDate,
        status: coupon.status,
        used: "Yes",
        active: "No"
      }});
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Manual scan endpoint – returns coupon details without updating its status.
router.get("/scan/manual/:code", async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ code: req.params.code }).populate("society event");
    if (!coupon) return res.status(404).json({ coupon: null });
    const today = new Date().toISOString().split("T")[0];
    if (coupon.expiryDate < today) {
      coupon.status = "expired";
      await coupon.save();
    }
    return res.json({ coupon: {
      qrCodeId: coupon._id,
      code: coupon.code,
      userName: coupon.userName,
      flatNo: coupon.flatNo,
      society: coupon.society ? coupon.society.name : "",
      event: coupon.event ? coupon.event.title : "",
      expiryDate: coupon.expiryDate,
      status: coupon.status,
      used: coupon.used ? "Yes" : "No",
      active: coupon.status === "active" ? "Yes" : "No"
    }});
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
