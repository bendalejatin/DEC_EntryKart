import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./styles/AdminProfile.css";

// const BASE_URL = "http://localhost:5000"; // Adjust this to your backend URL
const BASE_URL = "https://backend-clr8.onrender.com" ; // deployment url

const AdminProfile = () => {
  const [admin, setAdmin] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Administrator",
    image: "https://dummyimage.com/200x200/ccc/000&text=Admin",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [image, setImage] = useState(admin.image);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const adminEmail = localStorage.getItem("adminEmail");
        if (!adminEmail) return;

        const response = await axios.get(`${BASE_URL}/api/auth/profile?email=${adminEmail}`);
        setAdmin((prevAdmin) => ({
          ...prevAdmin,
          ...response.data,
          image: response.data.image || prevAdmin.image,
        }));
        setImage(response.data.image || "https://dummyimage.com/200x200/ccc/000&text=Admin");
      } catch (error) {
        console.error("Error fetching admin profile:", error);
      }
    };

    fetchAdminData();
  }, []);

  // Handle Image Upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageURL = URL.createObjectURL(file);
      setImage(imageURL);
    }
  };

  // Handle Profile Update
  const handleSave = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        alert("❌ No authentication token found. Please log in again.");
        return;
      }

      const updatedAdmin = { ...admin, image };
      await axios.put(`${BASE_URL}/api/auth/update`, updatedAdmin, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAdmin(updatedAdmin);
      setIsEditing(false);
      alert("✅ Profile updated successfully!");
    } catch (error) {
      console.error("Error updating admin profile:", error);
      alert("❌ Failed to update profile. Please log in again.");
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    navigate("/admin/login");
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        {/* Profile Image */}
        <div className="profile-image">
          <img src={image} alt="Admin Profile" />
          {isEditing && <input type="file" accept="image/*" onChange={handleImageChange} />}
        </div>

        {/* Profile Details */}
        <div className="profile-details">
          {isEditing ? (
            <>
              <input
                type="text"
                value={admin.name}
                onChange={(e) => setAdmin({ ...admin, name: e.target.value })}
              />
              <input
                type="email"
                value={admin.email}
                onChange={(e) => setAdmin({ ...admin, email: e.target.value })}
              />
              <input
                type="tel"
                value={admin.phone}
                onChange={(e) => setAdmin({ ...admin, phone: e.target.value })}
              />
              <input type="text" value={admin.role} readOnly />
              <button className="save-button" onClick={handleSave}>
                Save
              </button>
              <button className="cancel-button" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <h2 className="profile-name">{admin.name}</h2>
              <p className="profile-email">📧 {admin.email}</p>
              <p className="profile-phone">📞 {admin.phone}</p>
              <p className="profile-role">
                👨‍💼 Role: <strong>{admin.role}</strong>
              </p>
              <button className="edit-button" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
