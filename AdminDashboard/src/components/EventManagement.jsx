import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles/EventManagement.css";

// const BASE_URL = "http://localhost:5000"; // Adjust this to your backend URL
const BASE_URL = "https://backend-clr8.onrender.com" ; // deployment url

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
  });
  const [editingEvent, setEditingEvent] = useState(null);

  const adminEmail = localStorage.getItem("adminEmail");

  useEffect(() => {
    fetchEvents();
  },[] );

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/events?email=${adminEmail}`);
      setEvents(response.data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const handleChange = (e) => {
    setNewEvent({ ...newEvent, [e.target.name]: e.target.value });
  };

  const addEvent = async () => {
    if (!newEvent.title || !newEvent.description || !newEvent.date || !newEvent.location) {
      alert("Please fill all fields.");
      return;
    }
    try {
      const response = await axios.post(`${BASE_URL}/api/events`, { ...newEvent, adminEmail });
      setEvents([...events, response.data]);
      setNewEvent({ title: "", description: "", date: "", location: "" });
      alert("✅ Event added successfully!");
    } catch (error) {
      console.error("Error adding event:", error);
    }
  };

  const deleteEvent = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this event?");
    if (!confirmDelete) return;
    try {
      await axios.delete(`${BASE_URL}/api/events/${id}`);
      setEvents(events.filter((event) => event._id !== id));
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const editEvent = (event) => {
    setEditingEvent(event);
    setNewEvent(event);
  };

  const updateEvent = async () => {
    if (!editingEvent) return;
    try {
      const response = await axios.put(`${BASE_URL}/api/events/${editingEvent._id}`, newEvent);
      setEvents(events.map((event) => event._id === editingEvent._id ? response.data : event));
      setNewEvent({ title: "", description: "", date: "", location: "" });
      setEditingEvent(null);
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  const resetForm = () => {
    setNewEvent({ title: "",description: "", date: "", location: "" });
    setEditingEvent(null);
  };


  return (
    <div className="event-management">
      <h2>📅 Event Management</h2>
      <div className="event-form">
        <input type="text" name="title" placeholder="Event Title" value={newEvent.title} onChange={handleChange} />
        <textarea name="description" placeholder="Description" value={newEvent.description} onChange={handleChange}></textarea>
        <input type="date" name="date" value={newEvent.date} onChange={handleChange} />
        <input type="text" name="location" placeholder="Location" value={newEvent.location} onChange={handleChange} />
        {editingEvent ? (
          <>
            <button onClick={updateEvent}>Update Event</button>
            <button onClick={resetForm}>Cancel Edit</button>
          </>
        ) : (
          <button onClick={addEvent}>Add Event</button>
        )}
      </div>
      <div className="event-list">
        {events.length > 0 ? (
          events.map((event) => (
            <div key={event._id} className="event-card">
              <h3>{event.title}</h3>
              <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
              <p><strong>Location:</strong> {event.location}</p>
              <p><strong>Description:</strong> {event.description}</p>
              <div className="button-container">
              <button className="edit-btn" onClick={() => editEvent(event)}>✏ Edit</button>
              <button className="delete-btn" onClick={() => deleteEvent(event._id)}>🗑 Delete</button>
              </div>
            </div>
          ))
        ) : (
          <p>No events available.</p>
        )}
      </div>
    </div>
  );
};

export default EventManagement;
