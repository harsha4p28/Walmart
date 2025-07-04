import React, { useState } from "react";
import Navbar from "../Navbar/Navbar";
import './Login.css';
import login_logo from "../assets/login_logo.png";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username : "",
        password : ""
    });

    const handleChange = async(e)=> {
        setFormData(prev => ({...prev,[e.target.name]: e.target.value,}));
    }

    const handleLogin = async (e) => {
        e.preventDefault();

        alert("Login successful!");
        navigate("/Dashboard");

        //IMPORTANT - THIS IS ONLY FOR CREATING THE DASHBOARD FRAME//

        // try {
        //     const res = await fetch("http://localhost:5000/api/login", {
        //         method: "POST",
        //         headers: { "Content-Type": "application/json" },
        //         body: JSON.stringify(formData),
        //     });

        //     const data = await res.json();

        //     if (res.ok) {
        //         alert("Login successful!");
        //         navigate("/simulate");
        //     } else {
        //         alert(data.error || "Login failed. Try again.");
        //     }
        //     } catch (err) {
        //     console.error("Login error:", err);
        //     alert("Something went wrong. Please try later.");
        // }
    };


  return (
    <>
        <div className="page-container">
        <Navbar/>
        
        <form onSubmit={handleLogin}>
            <div className="login-container">
                <div className="login-logo">
                    <img src={login_logo} alt="Walmart"/>
                    <h2>Login to your dashboard</h2>
                </div>

                <label htmlFor="username">Username</label>
                <input id="username" type="text" name="username" placeholder="Enter your username" value={formData.username} onChange={handleChange} required />

                <label htmlFor="password">Password</label>
                <input id="password" type="password" name="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} required />

                <button className="submit-btn">Continue</button>

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
