import React, { useState } from "react";
import Navbar from "../Navbar/Navbar";
import "./Simulation.css";
import login_logo from "../assets/login_logo.png";
import { Link } from 'react-router-dom';

export default function Register() {
  return(
    <>
    <div className="page-container">
          <Navbar />
          
          <form>
            <div className="Simulation-container">
                <pre><h2>               Map It Before You Move It!</h2></pre>
    
              <label htmlFor="to">TO:</label>
              <input id="to" type="text" name="to" placeholder="to" required/>
    
              <label htmlFor="mode">MODE:</label>
              <input id="mode" type="text" name="mode" placeholder="Enter mode of transport" required/>
    
              <label htmlFor="model">MODEL OF MODE:</label>
              <input id="model" type="text" name="model" placeholder="Enter model of mode" required/>
    
              <label for="count">COUNT:</label>
              <textarea id="count" name="count" rows="4" cols="5" placeholder=" enter count"/>

    
              <button className="submit-btn" type="submit">VISUALIZE</button>
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

