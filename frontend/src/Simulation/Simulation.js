import React, { use, useState } from "react";
import Navbar from "../Navbar/Navbar";
import "./Simulation.css";
import { Link, useNavigate } from "react-router-dom";

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
  const [longitude,setLongitude] = useState(null);
  const navigate =useNavigate();

  const handleChange = async (e) => {
    const {name , value}=e.target;
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if(name==="to" && value.trim()!==""){
      try{
        const res=await fetch(`http://localhost:5000/api/location?q=${value}`,{
          method:'GET',
          credentials: 'include'
        });
        const data=await res.json();
        if(res.ok){
          setLocations(data);
        }
        else{
          alert(data.error || "Location not found");
        }
      }catch(error){
        console.error("Error fetching location:",error);
        alert("Failed to fetch location",error);
      }
    }else if(name==="to"){
      setLocations([]);
    }
  };

  const handleNavigate = () => {
  if (latitude !== null && longitude !== null) {
    localStorage.setItem("destinationLatitude", latitude);
    localStorage.setItem("destinationLongitude", longitude);
    localStorage.setItem("to", formData.to);
    localStorage.setItem("mode", formData.mode);
    localStorage.setItem("model", truckType);
    localStorage.setItem("count", formData.count);
    navigate("/Visualize");
  } else {
    alert("Please select a valid destination to visualize.");
  }
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
        <form onSubmit={handleNavigate}>
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
            />
            
            {/* Made changes Temporarily (need to change the visualize button to type submit and also redirect it to maps at the same time) */}
            <button className="submit-btn">
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
