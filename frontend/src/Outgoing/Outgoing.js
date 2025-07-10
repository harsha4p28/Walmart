import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import debounce from "lodash/debounce";
import { useNavigate } from "react-router-dom";
import { getDistance } from "geolib";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

export default function Outgoing() {
  const [fromCoords, setFromCoords] = useState(null);
  const [toCoordsList, setToCoordsList] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  // 1. Fetch coordinates
  const getCoords = async (place) => {
    const apiKey = "6c331e8e8fc24d71ac3553394860b032";
    const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(place)}&key=${apiKey}`);
    const result = await response.json();
    return result.results?.[0]?.geometry || null;
  };

  // 2. Emissions
  const fetchEmissions = async (distanceKm, truckType = "large", numTrucks = 1) => {
    const emissionFactors = { small: 0.14, medium: 0.21, large: 0.35, electric: 0.05 };
    return distanceKm * emissionFactors[truckType] * numTrucks;
  };

  // 3. Fetch on mount or load from localStorage
  useEffect(() => {
    const savedFrom = localStorage.getItem("fromCoords");
    const savedTo = localStorage.getItem("toCoordsList");

    if (savedFrom && savedTo) {
      setFromCoords(JSON.parse(savedFrom));
      setToCoordsList(JSON.parse(savedTo));
    } else {
      const fetchAll = async () => {
        try {
          const warehouseRes = await fetch("http://localhost:5000/api/warehouse", {
            method: "GET", credentials: "include",
          });

          if (!warehouseRes.ok) return alert("Could not fetch warehouse data");
          const warehouseData = await warehouseRes.json();
          const warehouseCoords = {
            lat: warehouseData.latitude,
            lng: warehouseData.longitude,
            label: "Warehouse",
          };
          setFromCoords(warehouseCoords);
          localStorage.setItem("fromCoords", JSON.stringify(warehouseCoords));

          const shipmentsRes = await fetch("http://localhost:5000/api/shipments", {
            method: "GET", credentials: "include",
          });

          const shipmentsData = await shipmentsRes.json();
          if (!shipmentsRes.ok) return alert(shipmentsData.error || "Failed to load outgoing shipments.");

          const coordsPromises = shipmentsData.outgoing.map(async (shipment) => {
            const coords = await getCoords(shipment.to_warehouse);
            return coords
              ? { lat: coords.lat, lng: coords.lng, label: shipment.to_warehouse, mode: shipment.mode, count: shipment.count }
              : null;
          });

          const resolvedCoords = (await Promise.all(coordsPromises)).filter(Boolean);
          setToCoordsList(resolvedCoords);
          localStorage.setItem("toCoordsList", JSON.stringify(resolvedCoords));
        } catch (error) {
          console.error("Error loading data:", error);
          alert("Error loading warehouse or shipment data");
        }
      };

      fetchAll();
    }
  }, []);

  // 4. Flow overlay
  function FlowOverlay() {
    const map = useMap();

    const updateNodePositions = async () => {
      if (!map || !fromCoords || toCoordsList.length === 0) return;

      const OFFSET_Y = 40;
      const fromPoint = map.latLngToContainerPoint([fromCoords.lat, fromCoords.lng]);

      const newNodes = [{
        id: "from",
        position: { x: fromPoint.x, y: fromPoint.y - OFFSET_Y },
        data: { label: "From: Warehouse" },
        type: "default",
        style: { width: 120, height: 35 },
      }];

      const newEdges = [];

      const emissionPromises = toCoordsList.map(async (toCoord, idx) => {
        const toPoint = map.latLngToContainerPoint([toCoord.lat, toCoord.lng]);
        const toId = `to-${idx}`;

        const distanceInKm = getDistance(
          { latitude: fromCoords.lat, longitude: fromCoords.lng },
          { latitude: toCoord.lat, longitude: toCoord.lng }
        ) / 1000;

        const emissions = await fetchEmissions(distanceInKm, toCoord.mode || "large", parseInt(toCoord.count) || 1);

        let strokeColor = "#2ecc71";
        if (emissions > 800) strokeColor = "#e67e22";
        if (emissions > 1500) strokeColor = "#e74c3c";

        newNodes.push({
          id: toId,
          position: { x: toPoint.x, y: toPoint.y - OFFSET_Y },
          data: { label: `To: ${toCoord.label}` },
          type: "default",
          style: { width: 120, height: 35 },
        });

        newEdges.push({
          id: `e-from-${toId}`,
          source: "from",
          target: toId,
          label: `${distanceInKm.toFixed(2)} km`,
          animated: true,
          markerEnd: {
            type: "arrowclosed", width: 20, height: 20, color: "#000",
          },
          labelStyle: { fontSize: 12, fill: "#222" },
          style: { stroke: strokeColor, strokeWidth: 2.5 },
          data: {
            truckType: toCoord.mode,
            numTrucks: toCoord.count,
            emissions: emissions.toFixed(2),
          },
        });
      });

      await Promise.all(emissionPromises);
      setNodes(newNodes);
      setEdges(newEdges);
      localStorage.setItem("nodes", JSON.stringify(newNodes));
      localStorage.setItem("edges", JSON.stringify(newEdges));
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

  useEffect(() => {
    const savedNodes = localStorage.getItem("nodes");
    const savedEdges = localStorage.getItem("edges");
    if (savedNodes && savedEdges) {
      setNodes(JSON.parse(savedNodes));
      setEdges(JSON.parse(savedEdges));
    }
  }, []);


  return (
    <>
      <div style={{ height: "90vh", width: "100%", position: "relative" }}>
        {/* Buttons on right */}
        <div style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}>
          <button onClick={() => window.location.reload()} style={{ padding: "10px", background: "#2ecc71", color: "white", borderRadius: "6px" }}>
            Refresh Map
          </button>
        </div>

        <MapContainer center={[15.63, 77.31]} zoom={6} style={{ height: "100%", width: "100%", zIndex: 1 }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {fromCoords && (
            <Marker position={[fromCoords.lat, fromCoords.lng]}>
              <Popup><strong>From: Warehouse</strong></Popup>
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
          top: 0,
          left: 0,
          height: "100%",
          width: "100%",
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: 2,
        }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onEdgeMouseEnter={(event, edge) => setHoveredEdge(edge)}
            onEdgeMouseLeave={() => setHoveredEdge(null)}
            onMouseMove={(event) => setCursorPos({ x: event.clientX, y: event.clientY })}
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
