import React, { useState, useEffect } from "react";
import Navbar from "../Navbar/Navbar";
import './Dashboard.css'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom"

export default function Dashboard() {

  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const currentLocation ="Hyderabad";
  const navigate = useNavigate();

  const handleSimulation = () => {
    navigate('/Simulation');
  }

  const handleIncoming = () => {
    navigate('/Incoming');
  }

  const handleOutgoing = () => {
    navigate('/Outgoing');
  }

  const handleFullmap = () => {
    navigate('/Fullmap');
  }
  
  useEffect(() => {
    localStorage.clear();


    fetch("http://localhost:5000/api/shipments", {
      method: "GET",
      credentials: "include", 
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch shipments");
        }
        return res.json();
      })
      .then((data) => {
        setIncoming(data.incoming || []);
        setOutgoing(data.outgoing || []);
      })
      .catch((err) => {
        console.error("Error fetching shipments:", err);
      });
  }, []);

  return (
    <>
      <div className="page-container">
        <div className="upper-part">
            <div className="bg-image"></div>
            <h1>WELCOME MANAGER</h1>
            <div className="options">
                <button onClick={handleSimulation}>
                  <FontAwesomeIcon icon={faPlus} /> New Simulation
                </button>

                <button onClick={handleFullmap}>Full Map</button>
            </div>
        </div>
        <div className="lower-part">
            <div className="lower-container">
              <h2>INCOMING</h2>
              <ul className="notify-list">
                {incoming.length === 0 ? <li>No incoming shipments</li> : incoming.map((item, index) => (
                  <li key={index}>
                    <label>{index + 1}. From: {item.from_warehouse}</label>
                  </li>
                ))}
              </ul>
              <button onClick={handleIncoming}>View On Map</button>
            </div>

            <div className="lower-container">
              <h2>OUTGOING</h2>
              <ul className="notify-list">
                {outgoing.length === 0 ? <li>No outgoing shipments</li> : outgoing.map((item, index) => (
                  <li key={index}>
                    <label>{index + 1}. To: {item.to_warehouse}</label>
                  </li>
                ))}
              </ul>
              <button onClick={handleOutgoing}>View On Map</button>
            </div>
        </div>

        <footer className="footer"> 
            <p>© 2025 Walmart Hackathon Project. All trademarks belong to their respective owners.</p>
            <p>This project is created solely for Sparkathon and is not affiliated with or endorsed by Walmart Inc.</p>
        </footer>
        </div>
    </>
  );
}
