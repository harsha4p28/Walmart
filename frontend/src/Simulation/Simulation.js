import React, { useState, useEffect } from "react"; 
import "./Simulation.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function Simulation() {

  const [formData, setFormData] = useState({
    to: "",
    mode: "truck", 
    model: "", 
    count: "",
    weight:"",
  });

  const [locations, setLocations] = useState([]);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  

  const navigate = useNavigate();

  
  const modeModels = {
    truck: [
      {
        value: "freight_vehicle-vehicle_type_rigid_truck-fuel_source_diesel-vehicle_weight_gt_3.5t_lte_7.5t-distance_basis_sfd",
        label: "Light Duty Truck (3.5-7.5 t Diesel)"
      },
      {
        value: "freight_vehicle-vehicle_type_rigid_truck-fuel_source_diesel-vehicle_weight_gt_7.5t_lte_12t-distance_basis_sfd",
        label: "Medium Duty Truck (7.5-12 t Diesel)"
      },
      {
        value: "freight_vehicle-vehicle_type_rigid_truck-fuel_source_diesel-vehicle_weight_gt_12t_lte_20t-distance_basis_sfd",
        label: "Heavy Duty Truck (12-20 t Diesel)"
      },
      {
        value: "fuel-type_electricity-fuel_use_electric_vehicle",
        label: "Electric Truck"
      }
    ],
    train: [
      {
        value: "freight_train-route_type_na-fuel_type_diesel-distance_basis_sfd",
        label: "Freight Train (Diesel)"
      },
    ],

    ship: [
      {
        value: "sea_freight-vessel_type_container-route_type_na-vessel_length_na-tonnage_na-fuel_source_na",
        label: "Container Ship (Average)"
      },
      {
        value: "sea_freight-vessel_type_products_tanker-route_type_na-vessel_length_na-tonnage_na-fuel_source_na",
        label: "Products Tanker (Average)"
      },
      {
        value: "sea_freight-vessel_type_crude_tanker-route_type_na-vessel_length_na-tonnage_gt_200000dwt-fuel_source_na",
        label: "Crude Tanker (>200 k DWT)"
      }
    ],
  };

  
  useEffect(() => {
    localStorage.clear();
    if (formData.mode && !formData.model) {
      
      const defaultModels = modeModels[formData.mode];
      if (defaultModels && defaultModels.length > 0) {
        setFormData((prev) => ({
          ...prev,
          model: defaultModels[0].value,
        }));
      }
    }
  }, [formData.mode, formData.model]); 

  const handleChange = async (e) => {
    const { name, value } = e.target;

    if (name === "mode") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        model: modeModels[value]?.[0]?.value || "", 
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    
    if (name === "to" && value.trim() !== "") {
      try {
        const res = await fetch(`http://localhost:5000/api/location?q=${value}`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();

        if (res.ok) {
          
          setLocations(data || []);
        } else {
          console.error("Server error:", data.error);
        }
      } catch (error) {
        console.error("Error fetching location:", error);
        alert("Server error while fetching location");
      }
    } else if (name === "to") {
      setLocations([]);
    }
  };

  const handleSubmitAndNavigate = async (e) => {
    e.preventDefault();

    if (!latitude || !longitude) {
      alert("Please select a valid destination from the list.");
      return;
    }

    try {
      const completeForm = {
        ...formData,
      };

      // const res = await fetch("http://localhost:5000/api/optimal", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   credentials: "include",
      //   body: JSON.stringify(completeForm),
      // });

      // const data = await res.json();

      toast.success("Simulation started successfully!");
      navigate("/Visualize", {
        state: {
          latitude,
          longitude,
          formData: completeForm,
        },
      });
    } catch (error) {
      console.error("Error in simulation:", error);
      alert("Failed to connect to simulation engine.");
    }
  };

  return (
    <>
      <div className="page-container">
        <form onSubmit={handleSubmitAndNavigate}>
          <div className="Simulation-container">
            <h2 style={{ textAlign: "center" }}>Map It Before You Move It!</h2>

            <label htmlFor="to">TO:</label>
            <div style={{ position: "relative", width: "100%" }}>
              <input
                id="to"
                type="text"
                name="to"
                className="to-input"
                placeholder="Enter destination"
                value={formData.to}
                onChange={handleChange}
                style={{ width: "100%" }}
                autoComplete="off"
                required
              />
              {locations.length > 0 && (
                <ul className="location-list">
                  {locations.map((location, index) => (
                    <li
                      key={index}
                      onClick={() => {
                        setFormData({ ...formData, to: location.name });
                        setLatitude(location.latitude);
                        setLongitude(location.longitude);
                        setLocations([]);
                      }}
                      className="location-item"
                    >
                      {location.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <label htmlFor="mode">MODE:</label>
            <select
              className="form-select" 
              name="mode" 
              value={formData.mode}
              onChange={handleChange}
              style={{height: "50px"}}
            >
              <option value="truck">Truck</option>
              <option value="train">Train</option>
              <option value="ship">Ship</option>
            </select>

            <label htmlFor="model">MODEL OF MODE:</label>
            <select
              className="form-select" 
              name="model" 
              value={formData.model}
              onChange={handleChange}
              style={{height: "50px"}}
            >
              {formData.mode && modeModels[formData.mode] ? (
                modeModels[formData.mode].map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))
              ) : (
                <option value="">-- Select a Mode First --</option>
              )}
            </select>

            <label htmlFor="count">COUNT:</label>
            <input
              id="count"
              name="count"
              placeholder=" Enter count"
              value={formData.count}
              onChange={handleChange}
              required
            />
            <label htmlFor="weight">WEIGHT:</label>
            <input
              id="weight"
              name="weight"
              placeholder="Enter Weight"
              value={formData.weight}
              onChange={handleChange}

            />
            <button type="submit" className="submit-btn">
              VISUALIZE
            </button>
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