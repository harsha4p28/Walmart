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
        <li><Link to={localStorage.getItem("isLoggedIn") === "true" ? "/Dashboard" : "/"}>HOME</Link></li>
        <li><a href="/History">HISTORY</a></li>
        <li><a href="/Policy"><Link to="/Policy" className="login-link">POLICY</Link></a></li>
      </ul>

      <div className="profile">
        <button className="icon-button">
          <Link to="/Notifications" className="login-link"><FontAwesomeIcon icon={faBell} /></Link>
        </button>
        
        <FontAwesomeIcon icon={faUser} />
        <span><Link to="/Profile" className="login-link"><p>Profile</p></Link></span>
        
      </div>
    </nav>
  );
}
