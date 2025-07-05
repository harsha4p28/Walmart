import React, { useEffect, useState } from "react";
import Navbar from "../Navbar/Navbar";
import "./Notifications.css";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/notifications")
    .then((res) => res.json())
    .then((data) => setNotifications(data))
    .catch((err) => console.error("Error fetching notifications:", err));
}, []);

  return (
    <div className="page-container">
      <Navbar />

      <div className="notifications-page">
        <h2>Notifications</h2>

        {notifications.length === 0 ? (
          <p className="msg">No notifications yet.</p>
        ) : (
          <ul className="notification-list">
            {notifications.map((note, index) => (
              <li key={index} className={`notification ${note.type}`}>
                <strong>{note.title}</strong>
                <p>{note.message}</p>
                <span className="time">{note.time}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="footer">
        <p>© 2025 Walmart Hackathon Project. Not affiliated with Walmart Inc.</p>
        <p>This project is created solely for Sparkathon and is not affiliated with or endorsed by Walmart Inc.</p>
      </footer>
    </div>
  );
}
