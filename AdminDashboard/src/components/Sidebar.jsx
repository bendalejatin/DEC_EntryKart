import React from "react";
import { Link } from "react-router-dom";
import "./styles/Sidebar.css";

const Sidebar = ({ isOpen }) => {
  return (
    <div className={`sidebar ${isOpen ? "expanded" : "collapsed"}`}>
      <ul>
        <li><Link to="/">🏠{isOpen && "Dashboard"}</Link></li>
        <li><Link to="/society">🏢{isOpen &&  "Society Management"}</Link></li>
        <li><Link to="/users">👥 {isOpen && "User Management"}</Link></li>
        <li><Link to="/coupons">🎟️{isOpen &&  "Coupon Management"}</Link></li>
        <li><Link to="/events">📅 {isOpen && "Event Management"}</Link></li>
        <li><Link to="/broadcast">📢{isOpen && "Broadcast Message"}</Link></li>
        <li><Link to="/flat-owner">🏠{isOpen && "Flat Owner Management"}</Link></li>
        <li><Link to="/entry-permission">📋 {isOpen && "Entry Permission"}</Link></li>
        <li><Link to="/profile">👤 {isOpen && "Admin Profile"}</Link></li>
        
       
        
      </ul>
    </div>
  );
};
export default Sidebar;
