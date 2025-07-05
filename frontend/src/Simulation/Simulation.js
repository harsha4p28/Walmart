import React, { useState } from "react";
import Navbar from "../Navbar/Navbar";
import "./Simulation.css";
import { Link } from "react-router-dom";

export default function Simulation() {
  const [formData, setFormData] = useState({
    to: "",
    mode: "",
    model: "",
    count: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Simulation started successfully!");
        console.log("Simulation response:", data);
      } else {
        alert(data.error || "Simulation failed");
      }
    } catch (error) {
      console.error("Error in simulation:", error);
      alert("Failed to connect to simulation engine.");
    }
  };

  return (
    <>
      <div className="page-container">
        <form onSubmit={handleSubmit}>
          <div className="Simulation-container">
            <h2 style={{ textAlign: "center" }}>Map It Before You Move It!</h2>

            <label htmlFor="to">TO:</label>
            <input
              id="to"
              type="text"
              name="to"
              placeholder="Enter destination"
              value={formData.to}
              onChange={handleChange}
              required
            />

            <label htmlFor="mode">MODE:</label>
            <input
              id="mode"
              type="text"
              name="mode"
              placeholder="Enter mode of transport"
              value={formData.mode}
              onChange={handleChange}
              required
            />

            <label htmlFor="model">MODEL OF MODE:</label>
            <input
              id="model"
              type="text"
              name="model"
              placeholder="Enter model of mode"
              value={formData.model}
              onChange={handleChange}
              required
            />

            <label htmlFor="count">COUNT:</label>
            <textarea
              id="count"
              name="count"
              rows="5"
              cols="5"
              placeholder=" Enter count"
              value={formData.count}
              onChange={handleChange}
            />

            <button className="submit-btn" type="submit">
              VISUALIZE
            </button>
          </div>
        </form>

        <footer className="footer">
          <p>© 2025 Walmart Hackathon Project. All trademarks belong to their respective owners.</p>
          <p>This project is created solely for Sparkathon and is not affiliated with or endorsed by Walmart Inc.</p>
        </footer>
      </div>
    </>
  );
}
