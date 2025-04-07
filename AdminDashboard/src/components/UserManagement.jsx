import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles/UserManagement.css";

// const BASE_URL = "http://localhost:5000"; // Adjust this to your backend URL
const BASE_URL = "https://backend-clr8.onrender.com" ; // deployment url

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [flats, setFlats] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    societyId: "",
    flatNumber: ""
  });
  const [editingUser, setEditingUser] = useState(null);
  const adminEmail = localStorage.getItem("adminEmail");

  useEffect(() => {
    if (adminEmail) {
      fetchUsers();
      fetchSocieties();
    }
  }, [adminEmail]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/users?email=${adminEmail}`);
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchSocieties = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/societies?email=${adminEmail}`);
      setSocieties(response.data);
    } catch (error) {
      console.error("Error fetching societies:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "societyId") {
      const selectedSociety = societies.find((s) => s._id === value);
      setFlats(selectedSociety ? selectedSociety.flats : []);
      setFormData((prev) => ({ ...prev, flatNumber: "" }));
    }
  };

  const saveUser = async () => {
    // Validate fields
    if (!formData.name || !formData.email || !formData.phone || !formData.societyId || !formData.flatNumber) {
      alert("⚠️ Please fill all fields.");
      return;
    }
    try {
      const payload = { ...formData, adminEmail };
      if (editingUser) {
        await axios.put(`${BASE_URL}/api/users/${editingUser._id}`, payload);
        alert("✅ User updated successfully!");
      } else {
        await axios.post(`${BASE_URL}/api/users`, payload);
        alert("✅ User added successfully!");
      }
      fetchUsers();
      resetForm();
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message;
      alert(`❌ Error: ${errMsg}`);
      console.error("Error saving user:", error);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      societyId: user.society?._id || "",
      flatNumber: user.flatNumber,
    });
    const selectedSociety = societies.find((s) => s._id === user.society?._id);
    setFlats(selectedSociety ? selectedSociety.flats : []);
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`${BASE_URL}/api/users/${id}`);
      fetchUsers();
    } catch (error) {
      alert(`❌ Error deleting user: ${error.response?.data?.message || error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", societyId: "", flatNumber: "" });
    setEditingUser(null);
    setFlats([]);
  };

  return (
    <div className="user-management">
      <h2>👥 User Management</h2>
      <form onSubmit={(e) => { e.preventDefault(); saveUser(); }} className="add-user-form">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter Name"
          required
        />
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter Email"
          required
        />
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Phone Number"
          required
        />
        <select name="societyId" value={formData.societyId} onChange={handleChange} required>
          <option value="">Select Society</option>
          {societies.map((society) => (
            <option key={society._id} value={society._id}>
              {society.name} ({society.location})
            </option>
          ))}
        </select>
        <select name="flatNumber" value={formData.flatNumber} onChange={handleChange} disabled={!formData.societyId} required>
          <option value="">Select Flat Number</option>
          {flats.map((flat, index) => (
            <option key={index} value={flat}>
              {flat}
            </option>
          ))}
        </select>
        <button type="submit">{editingUser ? "Update User" : "➕ Add User"}</button>
        {editingUser && <button type="button" onClick={resetForm}>Cancel Edit</button>}
      </form>

      <div className="user-list">
        <h3>📋 Users List</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Society</th>
              <th>Flat No</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone}</td>
                  <td>{user.society?.name || "N/A"}</td>
                  <td>{user.flatNumber}</td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEditUser(user)}>✏ Edit</button>
                    <button className="delete-btn" onClick={() => handleDeleteUser(user._id)}>🗑 Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
