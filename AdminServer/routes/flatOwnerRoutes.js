const express = require('express');
const router = express.Router();
const FlatOwner = require('../models/FlatOwner');
const Society = require('../models/Society');
const User = require('../models/User');
const Admin = require('../models/Admin');

// GET flat owner count (for dashboard)
router.get('/count', async (req, res) => {
  try {
    const adminEmail = req.query.email;
    let filter = {};
    if (adminEmail) {
      const admin = await Admin.findOne({ email: adminEmail });
      if (!admin || admin.role !== "superadmin") {
        filter.adminEmail = adminEmail;
      }
    }
    // Filter flat owners based on existing societies.
    let societies;
    if (adminEmail) {
      const admin = await Admin.findOne({ email: adminEmail });
      let societyFilter = {};
      if (!admin || admin.role !== "superadmin") {
        societyFilter.adminEmail = adminEmail;
      }
      societies = await Society.find(societyFilter, 'name');
    } else {
      societies = await Society.find({}, 'name');
    }
    const existingSocietyNames = societies.map(society => society.name);
    filter.societyName = { $in: existingSocietyNames };

    const count = await FlatOwner.countDocuments(filter);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all FlatOwner records (for table display)
// UPDATED: If an adminEmail is provided and not superadmin, only records from societies that belong to that admin are returned.
router.get('/all', async (req, res) => {
  try {
    const adminEmail = req.query.email;
    let filter = {};
    let existingSocietyNames = [];
    if (adminEmail) {
      const admin = await Admin.findOne({ email: adminEmail });
      let societyFilter = {};
      if (!admin || admin.role !== "superadmin") {
        societyFilter.adminEmail = adminEmail;
        // Also, flatowner records should be filtered by the same admin.
        filter.adminEmail = adminEmail;
      }
      const societies = await Society.find(societyFilter, 'name');
      existingSocietyNames = societies.map(society => society.name);
    } else {
      const societies = await Society.find({}, 'name');
      existingSocietyNames = societies.map(society => society.name);
    }
    filter.societyName = { $in: existingSocietyNames };

    const owners = await FlatOwner.find(filter);
    res.json(owners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET societies for dropdown
// UPDATED: Returns only societies belonging to the logged-in admin (if not superadmin)
router.get('/societies', async (req, res) => {
  try {
    const adminEmail = req.query.email;
    let filter = {};
    if (adminEmail) {
      const admin = await Admin.findOne({ email: adminEmail });
      if (!admin || admin.role !== "superadmin") {
        filter.adminEmail = adminEmail;
      }
    }
    const societies = await Society.find(filter, 'name');
    res.json(societies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET flat numbers for a given society
router.get('/flats/:societyName', async (req, res) => {
  try {
    const society = await Society.findOne({ name: req.params.societyName });
    if (!society) {
      return res.status(404).json({ message: 'Society not found' });
    }
    res.json(society.flats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET owner details by societyName and flatNumber – prepopulates from User if record not exists
router.get('/owner/:societyName/:flatNumber', async (req, res) => {
  try {
    // Check if the society exists.
    const society = await Society.findOne({ name: req.params.societyName });
    if (!society) {
      return res.status(404).json({ message: 'Society not found' });
    }
    let owner = await FlatOwner.findOne({
      societyName: req.params.societyName,
      flatNumber: req.params.flatNumber,
    });
    if (!owner) {
      // Look for a User record.
      const user = await User.findOne({ society: society._id, flatNumber: req.params.flatNumber });
      if (user) {
        owner = {
          ownerName: user.name,
          profession: user.profession || "",
          contact: user.phone,
          email: user.email,
          adminEmail: user.adminEmail,
          familyMembers: [],
          _id: null, // not yet saved in FlatOwner collection
        };
        return res.json(owner);
      }
      return res.status(404).json({ message: 'Owner not found' });
    }
    res.json(owner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST owner – Create or update a FlatOwner record and sync with User
router.post('/owner', async (req, res) => {
  try {
    const { societyName, flatNumber, ownerName, profession, contact, email, adminEmail } = req.body;
    let owner = await FlatOwner.findOne({ societyName, flatNumber });
    if (!owner) {
      owner = new FlatOwner({
        societyName,
        flatNumber,
        ownerName,
        profession,
        contact,
        email,
        adminEmail,
        familyMembers: []
      });
      await owner.save();

      // Sync with User model:
      const society = await Society.findOne({ name: societyName });
      if (society) {
        let user = await User.findOne({ society: society._id, flatNumber });
        if (user) {
          user.name = ownerName;
          user.email = email;
          user.phone = contact;
          user.profession = profession;
          await user.save();
        } else {
          user = new User({
            name: ownerName,
            flatNumber,
            society: society._id,
            email,
            phone: contact,
            adminEmail,
            profession
          });
          await user.save();
        }
      }
      return res.status(201).json(owner);
    } else {
      owner.ownerName = ownerName;
      owner.profession = profession;
      owner.contact = contact;
      owner.email = email;
      await owner.save();

      // Also update corresponding User record.
      const society = await Society.findOne({ name: societyName });
      if (society) {
        let user = await User.findOne({ society: society._id, flatNumber });
        if (user) {
          user.name = ownerName;
          user.email = email;
          user.phone = contact;
          user.profession = profession;
          await user.save();
        }
      }
      return res.json(owner);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT update owner details (without familyMembers) and sync with User model.
router.put('/owner/:id/update', async (req, res) => {
  try {
    const { ownerName, profession, contact, email, societyName, flatNumber } = req.body;
    const updatedOwner = await FlatOwner.findByIdAndUpdate(
      req.params.id,
      { ownerName, profession, contact, email },
      { new: true }
    );
    if (!updatedOwner) {
      return res.status(404).json({ message: 'Owner not found' });
    }
    // Sync with User model.
    const society = await Society.findOne({ name: societyName });
    if (society) {
      let user = await User.findOne({ society: society._id, flatNumber });
      if (user) {
        user.name = ownerName;
        user.email = email;
        user.phone = contact;
        user.profession = profession;
        await user.save();
      }
    }
    res.json(updatedOwner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE FlatOwner and corresponding User record
router.delete('/owner/:id', async (req, res) => {
  try {
    const owner = await FlatOwner.findById(req.params.id);
    if (!owner) {
      return res.status(404).json({ message: 'Owner not found' });
    }
    await FlatOwner.findByIdAndDelete(req.params.id);
    const society = await Society.findOne({ name: owner.societyName });
    if (society) {
      await User.findOneAndDelete({
        society: society._id,
        flatNumber: owner.flatNumber
      });
    }
    res.json({ message: "Owner and corresponding user deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT add a family member
router.put('/owner/:id/add-family', async (req, res) => {
  try {
    const { name, relation, age, profession, contact } = req.body;
    const owner = await FlatOwner.findById(req.params.id);
    if (!owner) {
      return res.status(404).json({ message: 'Owner not found' });
    }
    owner.familyMembers.push({ name, relation, age, profession, contact });
    await owner.save();
    res.json(owner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT edit a family member at the specified index
router.put('/owner/:id/edit-family/:index', async (req, res) => {
  try {
    const { name, relation, age, profession, contact } = req.body;
    const owner = await FlatOwner.findById(req.params.id);
    if (!owner) {
      return res.status(404).json({ message: 'Owner not found' });
    }
    const index = parseInt(req.params.index);
    if (index < 0 || index >= owner.familyMembers.length) {
      return res.status(400).json({ message: 'Invalid family member index' });
    }
    owner.familyMembers[index] = { name, relation, age, profession, contact };
    await owner.save();
    res.json(owner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE a family member at the specified index
router.delete('/owner/:id/delete-family/:index', async (req, res) => {
  try {
    const owner = await FlatOwner.findById(req.params.id);
    if (!owner) {
      return res.status(404).json({ message: 'Owner not found' });
    }
    const index = parseInt(req.params.index);
    if (index < 0 || index >= owner.familyMembers.length) {
      return res.status(400).json({ message: 'Invalid family member index' });
    }
    owner.familyMembers.splice(index, 1);
    await owner.save();
    res.json(owner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
