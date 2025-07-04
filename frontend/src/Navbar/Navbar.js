import React from "react";
import "./Navbar.css";
import logo from "../assets/logo.png";
import { Link } from 'react-router-dom';


import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faUser } from "@fortawesome/free-solid-svg-icons";

export default function Navbar() {
  return (
    <nav className="Nav">
      <div className="logo">
        <img src={logo} alt="Logo" />
      </div>

      <ul className="List">
        <li><a href="/">HOME</a></li>
        <li><a href="/History">HISTORY</a></li>
        <li><a href="/Policy">POLICY</a></li>
      </ul>

      <div className="profile">
        <button className="icon-button">
          <FontAwesomeIcon icon={faBell} />
        </button>
        
        <FontAwesomeIcon icon={faUser} />
        <span><Link to="/Profile" className="login-link"><p>Profile</p></Link></span>
        
      </div>
    </nav>
  );
}
