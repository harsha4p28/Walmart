import React, { useEffect, useState } from "react";
import Navbar from "../Navbar/Navbar";
import "./Profile.css";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [username , setUsername]=useState("");
  const [email,setEmail]=useState("");
  const [name , setName]=useState("");
  const [phno , setPhno]=useState("");
  const [loading, setLoading] = useState(true); 

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
  const handleProfileData= async () =>{
    try{
      const response = await fetch('http://localhost:5000/api/profile', {
          method: 'GET',
          credentials: 'include'
      });
      if (response.ok) {
          const data = await response.json();  
          setUsername(data.username);
          setEmail(data.email);
          setName(data.name);
          setPhno(data.phno);
      }else {
           console.error("Failed to load profile data from the backend");
      }
    }catch (error){
      console.error("Error retrieving profile data:", error);
    }
    finally{
      setLoading(false);
    }
  }
  useEffect(()=>{
    handleProfileData();
  },[])
  
  if (loading) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <div className="spinner" />
      </div>
    );
  }
  
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
                <input id="fullname" type="text" name="fullname" value={name} disabled/>
            </div>
            <div>
                <label htmlFor="email">Email:</label>
                <input id="email" type="text" name="email" value={email} disabled />
            </div>
            <div>
                <label htmlFor="username">Username:</label>
                <input id="username" type="text" name="username" value={username} disabled/>
            </div>
            {/* <div>
                <label htmlFor="password">Password:</label>
                <input id="password" type="password" name="password" />
            </div> */}
            <div>
                <label htmlFor="phno">Phone Number:</label>
                <input id="phno" type="text" name="phno" value={phno} disabled/>
            </div>
            <div>
                <label htmlFor="id">Employee ID:</label>
                <input id="id" type="number" name="id" disabled/>
            </div>
            <div>
                <label htmlFor="role">Role:</label>
                <input id="role" type="text" name="role" disabled />
            </div>
          </div>

          <button className="edit-btn">Edit Profile</button>
          <button className="edit-btn" onClick={handleLogOut}>Logout</button>
        </div>
      </div>
    </>
  );
}
