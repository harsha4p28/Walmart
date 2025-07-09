import React, { useState } from "react";
import Navbar from "../Navbar/Navbar";
import "./Simulation.css";
import { useNavigate } from "react-router-dom";

export default function Simulation() {
  const [truckType, setTruckType] = useState("large");
  const [formData, setFormData] = useState({
    to: "",
    mode: "",
    model: "",
    count: "",
  });

  const [locations, setLocations] = useState([]);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const navigate = useNavigate();

  const handleChange = async (e) => {
  const { name, value } = e.target;
  setFormData({ ...formData, [name]: value });

  if (name === "to" && value.trim() !== "") {
    try {
      const res = await fetch(`http://localhost:5000/api/location?q=${value}`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok) {
        // ✅ only show suggestions if available, no alert needed here
        setLocations(data || []);
      } else {
        console.error("Server error:", data.error);
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      // Optional alert if backend crashes
      alert("Server error while fetching location");
    }
  } else if (name === "to") {
    setLocations([]);
  }
};


  const handleSubmitAndNavigate = async (e) => {
    e.preventDefault();

    if (!latitude || !longitude) {
      alert("Please select a valid destination from the list.");
      return;
    }

    try {
      const completeForm = {
        ...formData,
        model: truckType,
      };

      const res = await fetch("http://localhost:5000/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(completeForm),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Simulation started successfully!");
        // Navigate to Visualize with data passed via state
        navigate("/Visualize", {
          state: {
            latitude,
            longitude,
            formData: completeForm,
          },
        });
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
        <form onSubmit={handleSubmitAndNavigate}>
          <div className="Simulation-container">
            <h2 style={{ textAlign: "center" }}>Map It Before You Move It!</h2>

            <label htmlFor="to">TO:</label>
            <div style={{ position: "relative", width: "100%" }}>
            <input
              id="to"
              type="text"
              name="to"
              className="to-input"
              placeholder="Enter destination"
              value={formData.to}
              onChange={handleChange}
              style={{ width: "100%" }}
              autoComplete="off"
              required
            />
            {locations.length > 0 && (
              <ul className="location-list">
                {locations.map((location, index) => (
                  <li
                    key={index}
                    onClick={() => {
                      setFormData({ ...formData, to: location.name });
                      setLatitude(location.latitude);
                      setLongitude(location.longitude);
                      setLocations([]);
                    }}
                    className="location-item"
                  >
                    {location.name}
                  </li>
                ))}
              </ul>
            )}
            </div>

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
            <select
              className="truckType"
              value={truckType}
              onChange={(e) => setTruckType(e.target.value)}
            >
              <option value="small">Light Duty Truck / Van / SUV (Small Diesel)</option>
              <option value="medium">Medium Duty Truck (Medium Diesel)</option>
              <option value="large">Heavy Duty Truck (Large Diesel)</option>
              <option value="electric">Electric Truck</option>
            </select>

            <label htmlFor="count">COUNT:</label>
            <textarea
              id="count"
              name="count"
              rows="5"
              cols="5"
              placeholder=" Enter count"
              value={formData.count}
              onChange={handleChange}
              required
            />

            <button type="submit" className="submit-btn">
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
