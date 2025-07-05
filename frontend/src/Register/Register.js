import React, { useState } from "react";
import Navbar from "../Navbar/Navbar";
import "./Register.css";
import login_logo from "../assets/login_logo.png";
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    phno: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;
    const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/; // Only letters, numbers, underscores; 4-20 chars

    if (!emailRegex.test(formData.email)) {
      alert("Please enter a valid email address");
      return;
    }

    if (!phoneRegex.test(formData.phno)) {
      alert("Phone number must be exactly 10 digits");
      return;
    }

    if (!usernameRegex.test(formData.username)) {
      alert("Username should be 4-20 characters, letters, numbers or underscores only");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Registered successfully!");
        navigate("/");
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to register. Please try again later.");
    }
  };


  return (
    <>
      <div className="page-container">
      <form onSubmit={handleRegister}>
        <div className="Register-container">
          <div className="login-logo">
            <img src={login_logo} alt="Walmart" />
            <h2>Create Your Dashboard - In Just One Click!</h2>
          </div>

          <label htmlFor="fullname">Fullname:</label>
          <input id="fullname" type="text" name="fullname" placeholder="Enter your Fullname" value={formData.fullname} onChange={handleChange} required/>

          <label htmlFor="email">Email:</label>
          <input id="email" type="text" name="email" placeholder="Enter your Email" value={formData.email} onChange={handleChange} required/>

          <label htmlFor="username">Username:</label>
          <input id="username" type="text" name="username" placeholder="Enter your Username" value={formData.username} onChange={handleChange} required/>

          <label htmlFor="password">Password:</label>
          <input id="password" type="password" name="password" placeholder="Enter your Password" value={formData.password} onChange={handleChange} required/>

          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input id="confirmPassword" type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required/>

          <label htmlFor="phno">Phone Number:</label>
          <input id="phno" type="text" name="phno" placeholder="Enter your Phone Number" value={formData.phno} onChange={handleChange} required/>

          <button className="submit-btn" type="submit">Register</button>

            <div className="login-pass">
                <p>Already have an account?<span><Link to="/Login" className="login-link"><p>Login</p></Link></span></p>
            </div>
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

