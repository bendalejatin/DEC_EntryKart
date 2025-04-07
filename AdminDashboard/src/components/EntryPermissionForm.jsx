import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../components/styles/EntryPermissionForm.css"; // Adjust the path if needed

const EntryPermissionForm = () => {
  const [entries, setEntries] = useState([]);
  const [name, setName] = useState("");
  const [flatNumber, setFlatNumber] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [description, setDescription] = useState("");
  const [additionalDateTime, setAdditionalDateTime] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Get admin email from localStorage
  const adminEmail = localStorage.getItem("adminEmail");

  useEffect(() => {
    fetchEntries();
    checkExpiringPermissions();
  }, []);

  const fetchEntries = async () => {
    try {
      // Include adminEmail in query to filter results (unless superadmin)
      const res = await axios.get(`http://localhost:5000/api/entries?email=${adminEmail}`);
      setEntries(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const checkExpiringPermissions = async () => {
    try {
      // Use the expiring-soon route to fetch entries expiring soon
      const res = await axios.get("http://localhost:5000/api/entries/expiring-soon");
      if (res.data.length > 0) {
        res.data.forEach((entry) => {
          toast.warn(`Permission for ${entry.name} is expiring soon!`);
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async () => {
    if (!name || !flatNumber || !dateTime || !description || !additionalDateTime) {
      toast.error("All fields are required");
      return;
    }

    const expirationDate = new Date(dateTime);
    expirationDate.setDate(expirationDate.getDate() + 7);

    if (!adminEmail) {
      toast.error("Admin email is missing. Please log in.");
      return;
    }

    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/entries/${editingId}`, {
          name,
          flatNumber,
          dateTime,
          description,
          additionalDateTime,
          expirationDate,
          adminEmail,
        });
        setEntries(
          entries.map((entry) =>
            entry._id === editingId
              ? { ...entry, name, flatNumber, dateTime, description, additionalDateTime, expirationDate }
              : entry
          )
        );
        setEditingId(null);
        toast.success("Entry updated successfully!");
      } else {
        const res = await axios.post("http://localhost:5000/api/entries", {
          name,
          flatNumber,
          dateTime,
          description,
          additionalDateTime,
          expirationDate,
          adminEmail,
        });
        setEntries([...entries, res.data]);
        toast.success("Entry added successfully!");
      }
      // Reset form fields
      setName("");
      setFlatNumber("");
      setDateTime("");
      setDescription("");
      setAdditionalDateTime("");
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (entry) => {
    setName(entry.name);
    setFlatNumber(entry.flatNumber);
    setDateTime(entry.dateTime);
    setDescription(entry.description);
    setAdditionalDateTime(entry.additionalDateTime);
    setEditingId(entry._id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/entries/${id}`);
      setEntries(entries.filter((entry) => entry._id !== id));
      toast.success("Entry deleted successfully!");
    } catch (error) {
      console.error(error);
    }
  };

  const filteredEntries = entries.filter(
    (entry) =>
      entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.flatNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container">
      <h2 className="title">Entry Permission Form</h2>
      <div className="form-group">
        <h3>Name:</h3>
        <input
          type="text"
          placeholder="Enter Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field"
        />
        
        <h3>Flat Number:</h3>
        <input
          type="text"
          placeholder="Enter Flat Number"
          value={flatNumber}
          onChange={(e) => setFlatNumber(e.target.value)}
          className="input-field"
        />
        <h3>Date & Time:</h3>
        <input
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          className="input-field"
        />
        <h3>Description:</h3>
        <textarea
          placeholder="Enter Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="textarea-field"
        />
        <h3>Expiry Date & Time:</h3>
        <input
          type="datetime-local"
          value={additionalDateTime}
          onChange={(e) => setAdditionalDateTime(e.target.value)}
          className="input-field"
        />
        <button className="btn add-btn" onClick={handleSave}>
          {editingId ? "Update Entry" : "Add Entry"}
        </button>
      </div>

      <h2 className="sub-title">Entries</h2>
      <input
        type="text"
        placeholder="Search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="input-field"
      />
      <div className="entries-list">
        {filteredEntries.map((entry) => (
          <div key={entry._id} className="entry">
            <div className="entry-text">
              <p>
                <strong>Name:</strong> {entry.name}
              </p>
              <p>
                <strong>Flat Number:</strong> {entry.flatNumber}
              </p>
              <p>
                <strong>Date & Time:</strong> {new Date(entry.dateTime).toLocaleString()}
              </p>
              <p>
                <strong>Description:</strong> {entry.description}
              </p>
              <p>
                <strong>Expiry Date & Time:</strong>{" "}
                {new Date(entry.additionalDateTime).toLocaleString()}
              </p>
              <div className="buttons">
                <button className="btn edit-btn" onClick={() => handleEdit(entry)}>
                  Edit
                </button>
                <button className="btn delete-btn" onClick={() => handleDelete(entry._id)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ToastContainer />
    </div>
  );
};

export default EntryPermissionForm;
