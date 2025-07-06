import React, { useState, useEffect } from "react";
import Navbar from "../Navbar/Navbar";
import './Dashboard.css'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom"

export default function Dashboard() {

  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const currentLocation ="Hyderabad";
  
  useEffect(() => {
    fetch("http://localhost:5000/api/shipments")
    .then((res) => res.json())
    .then((data) => {
        const inList = data.filter((entry) => entry.to === currentLocation);
        const outList = data.filter((entry) => entry.from === currentLocation);
        setIncoming(inList);
        setOutgoing(outList);
    })
    .catch((err) => console.error("Shipping error:", err));
  }, []);
  return (
    <>
      <div className="page-container">
        <div className="upper-part">
            <div className="bg-image"></div>
            <h1>WELCOME MANAGER</h1>
            <div className="options">
                <button>
                  <Link to="/Simulation" className="link"><FontAwesomeIcon icon={faPlus} /> New Simulation</Link>
                </button>

                <button className="full-map">Full Map</button>
            </div>
        </div>
        <div className="lower-part">
            <div className="lower-container">
              <h2>INCOMING</h2>
              <ul className="notify-list">
                {incoming.length === 0 ? <li>No incoming shipments</li> : incoming.map((item, index) => (
                  <li key={index}>
                    <label>{index + 1}. From: {item.from}</label>
                  </li>
                ))}
              </ul>
              <button>View On Map</button>
            </div>

            <div className="lower-container">
              <h2>OUTGOING</h2>
              <ul className="notify-list">
                {outgoing.length === 0 ? <li>No outgoing shipments</li> : outgoing.map((item, index) => (
                  <li key={index}>
                    <label>{index + 1}. To: {item.to}</label>
                  </li>
                ))}
              </ul>
              <button>View On Map</button>
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
