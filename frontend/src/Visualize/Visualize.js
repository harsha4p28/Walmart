import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import debounce from "lodash/debounce";
import { useNavigate, useLocation } from "react-router-dom";
import { getDistance } from "geolib";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
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

  useEffect(() => {

    const savedFromCoords = localStorage.getItem("fromCoords");
    const savedToCoords = localStorage.getItem("toCoordsList");
    const savedFormData = localStorage.getItem("formData");
    const savedLatLng = localStorage.getItem("toLatLng");

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
              label: "Warehouse",
            };
            const toCoords = [
              { lat: latitude, lng: longitude, label: formData.to || "Destination" },
            ];

            setFromCoords(fromCoord);
            setToCoordsList(toCoords);

            // Save to localStorage
            localStorage.setItem("fromCoords", JSON.stringify(fromCoord));
            localStorage.setItem("toCoordsList", JSON.stringify(toCoords));
            localStorage.setItem("formData", JSON.stringify(formData));
            localStorage.setItem("toLatLng", JSON.stringify({ latitude, longitude }));
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

    const simulationData = {
      to: formData.to,
      mode: formData.mode,
      model: formData.model,
      count: formData.count,
      emissions: emissionsValue,
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
      const fromPoint = map.latLngToContainerPoint([fromCoords.lat, fromCoords.lng]);

      const newNodes = [
        {
          id: "from",
          position: { x: fromPoint.x, y: fromPoint.y - OFFSET_Y },
          data: { label: `From: ${fromCoords.label}` },
          type: "default",
          style: { width: 120, height: 35 },
        },
      ];

      const newEdges = [];

      const emissionPromises = toCoordsList.map(async (toCoord, idx) => {
        const toPoint = map.latLngToContainerPoint([toCoord.lat, toCoord.lng]);
        const toId = `to-${idx}`;

        const truckType = formData.model || "large";
        const numTrucks = parseInt(formData.count) || 1;
        const computedDistance = getDistance(
          { latitude: fromCoords.lat, longitude: fromCoords.lng },
          { latitude: toCoord.lat, longitude: toCoord.lng }
        ) / 1000;

        setDistanceInKm(computedDistance); 


        const emissions = emissionsByIndex[idx] ?? 0;


        let strokeColor = "#2ecc71";
        if (emissions > 800) strokeColor = "#e67e22";
        if (emissions > 1500) strokeColor = "#e74c3c";

        newNodes.push({
          id: toId,
          position: { x: toPoint.x, y: toPoint.y - OFFSET_Y },
          data: { label: `To: ${toCoord.label}` },
          type: "default",
          style: { width: 120, height: 40 },
        });

        newEdges.push({
          id: `e-from-${toId}`,
          source: "from",
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

      // ✅ Save to localStorage
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

  return (
    <>
      <div style={{ height: "90vh", width: "100%", position: "relative" }}>
        <div style={{ position: "relative", width: "100%", height: "90vh" }}>
        <MapContainer center={[39, 34]} zoom={3} style={{ height: "100%", width: "100%", zIndex: 1 }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {fromCoords?.lat && fromCoords?.lng && (
            <Marker position={[fromCoords.lat, fromCoords.lng]}>
              <Popup><strong>From: Mumbai</strong></Popup>
            </Marker>
          )}
          {toCoordsList.map((coord, idx) => (
            <Marker key={idx} position={[coord.lat, coord.lng]}>
              <Popup><strong>{coord.label}</strong></Popup>
            </Marker>
          ))}
          <FlowOverlay />
        </MapContainer>

        <div style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            display: "flex",
            
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
            nodesDraggable={false}
            nodesConnectable={false}
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
