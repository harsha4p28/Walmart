import React, { useEffect, useState } from "react";
import Navbar from "../Navbar/Navbar";
import "./Notifications.css";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/notifications", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setNotifications(data))
      .catch((err) => console.error("Error fetching notifications:", err));
  }, []);

  const handleAccept = async (index) => {
    try {
      const res = await fetch("http://localhost:5000/api/acceptNotification", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notification_index: index }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Notification accepted");
        // Refresh notifications to show updated status
        setNotifications((prev) =>
          prev.map((note, i) =>
            i === index ? { ...note, is_accepted: true } : note
          )
        );
      } else {
        alert(data.error || "Failed to accept");
      }
    } catch (err) {
      console.error("Accept error:", err);
    }
  };

  return (
    <div className="page-container">
      <div className="notifications-page">
        <h2>Notifications</h2>

        {notifications.length === 0 ? (
          <p className="msg">No notifications yet.</p>
        ) : (
          <ul className="notification-list">
            {notifications.map((note, index) => (
              <li
                key={index}
                className={`notification ${note.is_accepted ? "accepted" : "pending"}`}
              >
                <div className="note-header">
                  <strong>{note.title}</strong>
                  <span className="status">
                    {note.is_accepted ? "✅ Accepted" : "⏳ Pending"}
                  </span>
                </div>
                <p>{note.message}</p>
                <span className="time">{note.time}</span>
                {!note.is_accepted && (
                  <button onClick={() => handleAccept(index)} className="accept-btn">
                    Accept
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="footer">
        <p>© 2025 Walmart Hackathon Project. Not affiliated with Walmart Inc.</p>
        <p>
          This project is created solely for Sparkathon and is not affiliated with or
          endorsed by Walmart Inc.
        </p>
      </footer>
    </div>
  );
}