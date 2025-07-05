import React from "react";
import Navbar from "../Navbar/Navbar";
import "./Profile.css";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate=useNavigate()
  const handleLogOut = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/logout', {
                method: 'POST',
                credentials: 'include'
            });
            if (response.ok) { 
                navigate('/');
                window.location.reload();
            } else {
                console.error("Failed to log out on the backend");
            }
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };
  
  
  return (
    <>
      <div className="profile-page">
        <div className="sidebar">
          <h3>Settings</h3>
          <ul>
            <li className="active">Account</li>
            <li>Security</li>
            <li>Documents</li>
          </ul>
        </div>

        <div className="profile-main">
          <h2>My Profile</h2>
          <div className="profile-info">
            <div>
                <label htmlFor="fullname">Fullname:</label>
                <input id="fullname" type="text" name="fullname" />
            </div>
            <div>
                <label htmlFor="email">Email:</label>
                <input id="email" type="text" name="email" />
            </div>
            <div>
                <label htmlFor="username">Username:</label>
                <input id="username" type="text" name="username" />
            </div>
            <div>
                <label htmlFor="password">Password:</label>
                <input id="password" type="password" name="password" />
            </div>
            <div>
                <label htmlFor="phno">Phone Number:</label>
                <input id="phno" type="text" name="phno" />
            </div>
            <div>
                <label htmlFor="id">Employee ID:</label>
                <input id="id" type="number" name="id" />
            </div>
            <div>
                <label htmlFor="role">Role:</label>
                <input id="role" type="text" name="role" />
            </div>
          </div>

          <button className="edit-btn">Edit Profile</button>
          <button className="edit-btn" onClick={handleLogOut}>Logout</button>
        </div>
      </div>
    </>
  );
}
