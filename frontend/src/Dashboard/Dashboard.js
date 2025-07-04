import React from "react";
import Navbar from "../Navbar/Navbar";
import './Dashboard.css'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom"

export default function Dashboard() {
  return (
    <>
      <div className="page-container">
      <Navbar/>
        <div className="upper-part">
            <div className="bg-image"></div>
            <h1>WELCOME MANAGER</h1>
            <div className="options">
                <button className="simulation"><FontAwesomeIcon icon={faPlus} /><Link to="/Simulation" className="login-link">New Simulation</Link></button>
                <button className="full-map">Full Map</button>
            </div>
        </div>
        <div className="lower-part">
            <div className="left-part"></div>
            <div className="right-part"></div>
        </div>


        <footer className="footer"> 
            <p>© 2025 Walmart Hackathon Project. All trademarks belong to their respective owners.</p>
            <p>This project is created solely for Sparkathon and is not affiliated with or endorsed by Walmart Inc.</p>
        </footer>
        </div>
    </>
  );
}
