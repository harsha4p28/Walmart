import React, { useEffect } from 'react';
import './Home.css';
import Navbar from '../Navbar/Navbar';
import { Link } from 'react-router-dom';
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const routeRegister = () => {
    navigate('/Register');
  }

  useEffect(() => {
    if (localStorage.getItem("isLoggedIn") === "true") {
      navigate("/Dashboard");
    }
  }, []);

  return (
    <>
        <div className='page-container'>
        <div className="home-container">
            <h1>Welcome to the Walmart Simulation Platform</h1>
            <p>Simulate operations, reduce emissions, and collaborate with managers.</p>
            <button onClick={routeRegister}>Login/Register</button>
        </div>
        <footer className="footer"> 
            <p>© 2025 Walmart Hackathon Project. All trademarks belong to their respective owners.</p>
            <p>This project is created solely for Sparkathon and is not affiliated with or endorsed by Walmart Inc.</p>
        </footer>
        </div>
    </>
  );
}
