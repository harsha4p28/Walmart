import {React ,  useEffect, useState} from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './App.css';
import Navbar from './Navbar/Navbar';
import Home from './Home/Home';
import Login from './Login/Login';
import Register from './Register/Register';
import Dashboard from './Dashboard/Dashboard';
import Simulation from './Simulation/Simulation';
import Profile from './Profile/Profile';
import Notifications from './Notifications/Notifications';
import Policy from './Policy/Policy';
import Visualize from './Visualize/Visualize';
import Reactflow from './Reactflow/Reactflow';
import Incoming from './Incoming/Incoming';
import Outgoing from './Outgoing/Outgoing';
import Fullmap from './Fullmap/Fullmap';

function App() {
  const [userLoggedin, setUserLoggedin] = useState(false);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {

    const ro = new ResizeObserver(() => {});
    ro.observe(document.body);

    const checkAuth = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/me', {
          method: 'GET',
          credentials: 'include'
        });

        if (res.ok) {
          const data = await res.json();
          setUserLoggedin(true);
        } else if (res.status === 401) {
          const refreshRes = await fetch('http://localhost:5000/api/refresh', {
            method: 'POST',
            credentials: 'include'
          });

          if (refreshRes.ok) {
            setUserLoggedin(true);
          } else {
            setUserLoggedin(false);
          }
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setUserLoggedin(false);
      } 
      finally{
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

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
    <Router>
      <Navbar/>
      <Routes>
        <Route path='/' element={userLoggedin ? <Dashboard /> : <Home />} />
        <Route path="/Register" element={<Register />} />
        <Route path="/Login" element={<Login setUserLoggedin={setUserLoggedin}/>} />
        {/* <Route path="/Dashboard" element={<Dashboard />} /> */}
        <Route path="/Simulation" element={<Simulation />} />
        <Route path="/Profile" element={userLoggedin ? <Profile /> : <Register />} />
        <Route path="/Notifications" element={<Notifications />} />
        <Route path="/Policy" element={<Policy />} />
        <Route path="/Visualize" element={<Visualize />} />
        <Route path="/Reactflow" element={<Reactflow />} />
        <Route path="/Incoming" element={<Incoming />} />
        <Route path="/Outgoing" element={<Outgoing />} />
        <Route path="/Fullmap" element={<Fullmap />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />
    </Router>
  );
}

export default App;
