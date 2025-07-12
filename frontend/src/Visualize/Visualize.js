import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import './Visualize.css';
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import debounce from "lodash/debounce";
import { useNavigate, useLocation } from "react-router-dom";
import { getDistance } from "geolib";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";



delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});


export default function Visualize() {
  const location = useLocation();
  let { latitude, longitude, formData } = location.state || {};

// Fallback if formData is undefined
if (!formData) {
  try {
    formData = JSON.parse(localStorage.getItem("formData")) || {};
    const coords = JSON.parse(localStorage.getItem("toLatLng"));
    if (coords) {
      latitude = coords.latitude;
      longitude = coords.longitude;
    }
  } catch (e) {
    formData = {};
  }
}
  const [fromCoords, setFromCoords] = useState([]);
  const [toCoordsList, setToCoordsList] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [nodesForNextPage, setNodesForNextPage] = useState([]);
  const [edgesForNextPage, setEdgesForNextPage] = useState([]);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [distanceInKm, setDistanceInKm] = useState(null);
  const [emissionsByIndex, setEmissionsByIndex] = useState({});
  const [allWarehouse, setallWarehouse] = useState([]);
  const [via1, setVia1] = useState("");
  const [via2, setVia2] = useState("");
  const [locations, setLocations] = useState([]);
  const [selectedVias, setSelectedVias] = useState({ via1: null, via2: null });
  const [intermediateCoordsList, setIntermediateCoordsList] = useState([]);


  

  useEffect(() => {

    const savedFromCoords = localStorage.getItem("fromCoords");
    const savedToCoords = localStorage.getItem("toCoordsList");
    const savedFormData = localStorage.getItem("formData");
    const savedLatLng = localStorage.getItem("toLatLng");
     const savedWarehouseList = localStorage.getItem("allWarehouse");
     const intermediateCoordsList = localStorage.getItem("intermediateCoordsList");

  if (savedWarehouseList) {
    setallWarehouse(JSON.parse(savedWarehouseList));
  }
  if (intermediateCoordsList) {
    setIntermediateCoordsList(JSON.parse(intermediateCoordsList));
  }

    if (savedFromCoords && savedToCoords && savedFormData && savedLatLng) {
      setFromCoords(JSON.parse(savedFromCoords));
      setToCoordsList(JSON.parse(savedToCoords));
      formData = JSON.parse(savedFormData);
      const { latitude: lat, longitude: lng } = JSON.parse(savedLatLng);
      latitude = lat;
      longitude = lng;
      return;
    }

    if (latitude && longitude && formData) {
      const fetchCoords = async () => {
        try {
          const response = await fetch("http://localhost:5000/api/warehouse", {
            method: "GET",
            credentials: "include",
          });

          if (response.ok) {
            const data = await response.json();
            const fromCoord = {
              lat: data.latitude,
              lng: data.longitude,
              label: data.name,
            };
            const toCoords = [
              { lat: latitude, lng: longitude, label: formData.to || "Destination" },
            ];

            const filteredWarehouseList = (data.warehouse_list || []).filter((wh) => {
            const isSameAsFrom =
              wh.latitude === fromCoord.lat && wh.longitude === fromCoord.lng;
            const isSameAsTo =
              toCoords.length > 0 &&
              wh.latitude === toCoords[0].lat &&
              wh.longitude === toCoords[0].lng;
            return !isSameAsFrom && !isSameAsTo;
          });
            
            
            console.log(allWarehouse)
            setFromCoords(fromCoord);
            setToCoordsList(toCoords);
            setallWarehouse(filteredWarehouseList);

            // Save to localStorage
            localStorage.setItem("fromCoords", JSON.stringify(fromCoord));
            localStorage.setItem("toCoordsList", JSON.stringify(toCoords));
            localStorage.setItem("formData", JSON.stringify(formData));
            localStorage.setItem("toLatLng", JSON.stringify({ latitude, longitude }));
            localStorage.setItem("allWarehouse", JSON.stringify(filteredWarehouseList));

          } else {
            console.error("Failed to load warehouse data from the backend");
          }
        } catch (error) {
          console.error("Error retrieving profile data:", error);
        }
      };

      fetchCoords();
    }
  }, []);

  useEffect(() => {
  const fetchEmissionsData = async () => {
    const savedFormData = JSON.parse(localStorage.getItem("formData") || "{}");

    if (!savedFormData.mode || !savedFormData.model || !savedFormData.count || !savedFormData.weight) {
      console.warn("Missing required form data for /api/optimal request.");
      return;
    }

    const emissionsData = {};

    for (let i = 0; i < toCoordsList.length; i++) {
      const toCoord = toCoordsList[i];

      const computedDistance = getDistance(
        { latitude: fromCoords.lat, longitude: fromCoords.lng },
        { latitude: toCoord.lat, longitude: toCoord.lng }
      ) / 1000;

      try {
        const response = await fetch("http://localhost:5000/api/optimal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            mode: savedFormData.mode,
            model: savedFormData.model,
            distance: computedDistance,
            count: savedFormData.count,
            weight: savedFormData.weight,
          }),
        });

        const data = await response.json();
        emissionsData[i] = Math.round(data.co2e_per_trip * 100) / 100;

        console.log(`Emissions for toCoord ${i}:`, emissionsData[i]);
      } catch (e) {
        console.error(`Error fetching emissions for toCoord ${i}:`, e);
      }
    }

    setEmissionsByIndex(emissionsData);
  };

  if (fromCoords.lat && toCoordsList.length > 0) {
    fetchEmissionsData();
  }
}, [fromCoords, toCoordsList]);



  const handleLock = async () => {
  try {
    if (!formData || !formData.to || !formData.mode || !formData.model || !formData.count) {
      alert("Simulation data is incomplete. Please fill out the form again.");
      return;
    }

    const emissionsValue = emissionsByIndex[0];

    if (emissionsValue === undefined || emissionsValue === null) {
      alert("Emissions data not ready yet. Please wait a moment and try again.");
      return;
    }
    const intermediateCoordsList = JSON.parse(localStorage.getItem("intermediateCoordsList") || "[]");

    const simulationData = {
      to: formData.to,
      mode: formData.mode,
      model: formData.model,
      count: formData.count,
      emissions: emissionsValue,
      intermediates: intermediateCoordsList,
    };

    console.log("Sending simulation data:", simulationData); // ✅ Debug print

    const response = await fetch("http://localhost:5000/api/addSimulation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(simulationData),
    });

    const data = await response.json();

    if (response.ok) {
      alert("Simulation data successfully saved!");
      console.log("Saved:", data);

      // ✅ Clear localStorage after locking the route
      localStorage.removeItem("fromCoords");
      localStorage.removeItem("toCoordsList");
      localStorage.removeItem("formData");
      localStorage.removeItem("toLatLng");
      localStorage.removeItem("flowNodes");
      localStorage.removeItem("flowEdges");
    } else {
      alert(data.error || "Failed to save simulation data.");
    }
  } catch (error) {
    console.error("Error sending simulation data:", error);
    alert("An error occurred while saving the simulation.");
  }
};

  function FlowOverlay() {
    const map = useMap();

    const updateNodePositions = async () => {
      if (!map || !fromCoords.lat || !fromCoords.lng || toCoordsList.length === 0) return;

      const OFFSET_Y = 40;
      const newNodes = [];
      const newEdges = [];

      const fromPoint = map.latLngToContainerPoint([fromCoords.lat, fromCoords.lng]);

      newNodes.push({
        id: "from",
        position: { x: fromPoint.x, y: fromPoint.y - OFFSET_Y },
        data: { label: `From: ${fromCoords.label}` },
        type: "default",
        style: { width: 120, height: 50 },
      });

      // 1️⃣ Add intermediate nodes
      let lastNodeId = "from";
      for (let i = 0; i < intermediateCoordsList.length; i++) {
        const via = intermediateCoordsList[i];
        const viaId = `via-${i}`;
        const viaPoint = map.latLngToContainerPoint([via.lat, via.lng]);

        newNodes.push({
          id: viaId,
          position: { x: viaPoint.x, y: viaPoint.y - OFFSET_Y },
          data: { label: `Via: ${via.label}` },
          type: "default",
          style: { width: 120, height: 50, backgroundColor: "#f39c12" },
        });

        const distance = getDistance(
          {
            latitude: fromCoords.lat,
            longitude: fromCoords.lng,
          },
          {
            latitude: via.lat,
            longitude: via.lng,
          }
        ) / 1000;

        newEdges.push({
          id: `e-${lastNodeId}-${viaId}`,
          source: lastNodeId,
          target: viaId,
          label: `${distance.toFixed(2)} km`,
          animated: true,
          style: { stroke: "#8e44ad", strokeWidth: 2 },
          markerEnd: {
            type: "arrowclosed",
            width: 20,
            height: 20,
            color: "#000",
          },
        });

        lastNodeId = viaId;
      }

      // 2️⃣ Add final destination nodes
      const emissionPromises = toCoordsList.map(async (toCoord, idx) => {
        const toPoint = map.latLngToContainerPoint([toCoord.lat, toCoord.lng]);
        const toId = `to-${idx}`;
        const truckType = formData.model || "large";
        const numTrucks = parseInt(formData.count) || 1;

        const emissions = emissionsByIndex[idx] ?? 0;
        const computedDistance = getDistance(
          intermediateCoordsList.length > 0
            ? {
                latitude: intermediateCoordsList[intermediateCoordsList.length - 1].lat,
                longitude: intermediateCoordsList[intermediateCoordsList.length - 1].lng,
              }
            : { latitude: fromCoords.lat, longitude: fromCoords.lng },
          { latitude: toCoord.lat, longitude: toCoord.lng }
        ) / 1000;

        let strokeColor = "#2ecc71";
        if (emissions > 800) strokeColor = "#e67e22";
        if (emissions > 1500) strokeColor = "#e74c3c";

        newNodes.push({
          id: toId,
          position: { x: toPoint.x, y: toPoint.y - OFFSET_Y },
          data: { label: `To: ${toCoord.label}` },
          type: "default",
          style: { width: 120, height: 50 },
        });

        newEdges.push({
          id: `e-${lastNodeId}-${toId}`,
          source: lastNodeId,
          target: toId,
          label: `${computedDistance.toFixed(2)} km`,
          animated: true,
          markerEnd: {
            type: "arrowclosed",
            width: 20,
            height: 20,
            color: "#000",
          },
          labelStyle: { fontSize: 12, fill: "#222" },
          style: { stroke: strokeColor, strokeWidth: 2.5 },
          data: {
            truckType,
            numTrucks,
            emissions: Math.round(emissions * 100) / 100,
          },
        });
      });

      await Promise.all(emissionPromises);

      setNodes(newNodes);
      setEdges(newEdges);
      setNodesForNextPage(newNodes);
      setEdgesForNextPage(newEdges);

      localStorage.setItem("flowNodes", JSON.stringify(newNodes));
      localStorage.setItem("flowEdges", JSON.stringify(newEdges));
    };


    const debouncedUpdate = debounce(updateNodePositions, 100);

    useEffect(() => {
      map.on("zoom", debouncedUpdate);
      map.on("move", debouncedUpdate);
      return () => {
        map.off("zoom", debouncedUpdate);
        map.off("move", debouncedUpdate);
      };
    }, [map, fromCoords, toCoordsList]);

    return null;
  }

  

  const navigate = useNavigate();

  const routeReactFlow = () => {
    const storedNodes = JSON.parse(localStorage.getItem("flowNodes") || "[]");
    const storedEdges = JSON.parse(localStorage.getItem("flowEdges") || "[]");

    navigate("/Reactflow", {
      state: {
        nodes: nodesForNextPage.length ? nodesForNextPage : storedNodes,
        edges: edgesForNextPage.length ? edgesForNextPage : storedEdges,
      },
    });
  };


  useEffect(() => {
  const query = via1;
  if (!query) return;

  const fetchLocation = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/location?q=${query}`, {
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
  };

  fetchLocation();
}, [via1]);

  const handleIntermediate = async (e) => {
  e.preventDefault();

  const {via1} = selectedVias;

  const intermediates = [];

  if (via1) {
    intermediates.push({
      lat: via1.latitude,
      lng: via1.longitude,
      label: via1.name,
    });
  }


  setIntermediateCoordsList(intermediates);
  localStorage.setItem("intermediateCoordsList", JSON.stringify(intermediates));
  };

  // try {
  //   const res = await fetch("http://localhost:5000/api/aiAnalysis", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     credentials: "include",
  //     body: JSON.stringify({
  //       via1: {
  //         name: via1.name,
  //         latitude: via1.latitude,
  //         longitude: via1.longitude,
  //       },
  //       // via2: {
  //       //   name: via2.name,
  //       //   latitude: via2.latitude,
  //       //   longitude: via2.longitude,
  //       // },
  //     }),
  //   });

  //   const data = await res.json();

  //   if (res.ok) {
  //     alert("Intermediate locations submitted successfully!");
  //     console.log("✔️ Submitted:", data);
  //   } else {
  //     alert(data.error || "Failed to submit intermediate locations.");
  //   }
  // } catch (error) {
  //   console.error("❌ Submission error:", error);
  //   alert("Server error while submitting intermediate locations.");
  // }

  return (
    <>
      <div style={{ height: "90vh", width: "100%", position: "relative" }}>
        <div style={{ position: "relative", width: "100%", height: "90vh" }}>
          <MapContainer 
            center={[39, 34]} 
            zoom={3} 
            style={{ height: "100%", width: "100%", zIndex: 1 }} 
            worldCopyJump={false}
            maxBounds={[[-90, -180], [90, 180]]}
            maxBoundsViscosity={1.0}
          >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {fromCoords?.lat && fromCoords?.lng && (
            <Marker position={[fromCoords.lat, fromCoords.lng]}>
              <Popup><strong>From: {fromCoords.label} (warehouse)</strong></Popup>
            </Marker>
          )}
          {toCoordsList.map((coord, idx) => (
            <Marker key={idx} position={[coord.lat, coord.lng]}>
              <Popup><strong>{coord.label}</strong></Popup>
            </Marker>
          ))}
          {allWarehouse.map((coord, idx) => (
            <Marker key={idx} position={[coord.latitude, coord.longitude]} icon={redIcon}>
              <Popup><strong>{coord.name}</strong></Popup>
            </Marker>
          ))}
          <FlowOverlay />
        </MapContainer>

        <div style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            display: "flex",
            flexDirection:"column",
            gap: "10px",
            zIndex: 1000,
          }}>
            <button
              onClick={handleLock}
              style={{
                padding: "10px 15px",
                background: "#27ae60",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              Lock Route
            </button>
            <button
              onClick={routeReactFlow}
              style={{
                padding: "10px 15px",
                background: "#3498db",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              Flow View
            </button>
            <form className="via-form" onSubmit={handleIntermediate}>
              <label style={{fontWeight:"bold"}}>From: {fromCoords.label} (warehouse)</label>
              
              <label style={{fontWeight:"bold"}}>To: {formData?.to || "Destination"}</label>

              <label style={{fontWeight:"bold"}}>Via 1:{intermediateCoordsList.label}</label>
              <input
                type="text"
                placeholder="Select intermediate warehouse"
                value={via1}
                onChange={(e) => setVia1(e.target.value)}
                autoComplete="off"
                className="via-input"
              />
              {locations.length > 0 && via1 && (
                <ul className="location-list">
                  {locations.filter((loc) => loc.name?.trim().toLowerCase() !== formData?.to?.trim().toLowerCase()).map((loc, index) => (
                    <li
                      key={index}
                      className="location-item"
                      onClick={() => {
                        setSelectedVias((prev) => ({ ...prev, via1: loc }));
                        setVia1(loc.name);
                        setLocations([]);
                      }}
                    >
                      {loc.name}
                    </li>
                  ))}
                </ul>
              )}

              <button className="submit-btn" type="submit">Submit</button>
            </form>

          </div>
                  
        </div>

        <div style={{
          position: "absolute", top: 0, left: 0, height: "100%", width: "100%",
          overflow: "hidden", pointerEvents: "none", zIndex: 2
        }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onEdgeMouseEnter={(e, edge) => setHoveredEdge(edge)}
            onEdgeMouseLeave={() => setHoveredEdge(null)}
            onMouseMove={(e) => setCursorPos({ x: e.clientX, y: e.clientY })}
            nodesDraggable={true}
            nodesConnectable={true}
            zoomOnScroll={false}
            panOnDrag={false}
          >
            <Background />
            <Controls />
          </ReactFlow>
          {hoveredEdge && (
            <div style={{
              position: "fixed",
              top: cursorPos.y + 10,
              left: cursorPos.x + 10,
              background: "#222",
              color: "#fff",
              padding: "8px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              pointerEvents: "none",
              zIndex: 1000,
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}>
              <div><strong>🚛 Truck Type:</strong> {hoveredEdge.data?.truckType}</div>
              <div><strong>🛻 No. of Trucks:</strong> {hoveredEdge.data?.numTrucks}</div>
              <div><strong>📏 Distance:</strong> {hoveredEdge.label}</div>
              <div><strong>🌿 Emissions:</strong> {hoveredEdge.data?.emissions} kg CO₂</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
