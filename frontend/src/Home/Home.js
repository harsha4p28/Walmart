import React from 'react';
import './Home.css';
import Navbar from '../Navbar/Navbar';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <>
        <div className='page-container'>
        <Navbar/>
        <div className="home-container">
            <h1>Welcome to the Walmart Simulation Platform</h1>
            <p>Simulate operations, reduce emissions, and collaborate with managers.</p>
            <button><Link to="/Register" className="login-link">Login/Register</Link></button>
        </div>
        <footer className="footer"> 
            <p>© 2025 Walmart Hackathon Project. All trademarks belong to their respective owners.</p>
            <p>This project is created solely for Sparkathon and is not affiliated with or endorsed by Walmart Inc.</p>
        </footer>
        </div>
    </>
  );
}
