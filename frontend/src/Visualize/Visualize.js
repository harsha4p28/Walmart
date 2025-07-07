import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

export default function Visualize() {
  const [fromCoords, setFromCoords] = useState(null);
  const [toCoords, setToCoords] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const getCoords = async (place) => {
    const apiKey = "6c331e8e8fc24d71ac3553394860b032"; // Replace with your real key
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(place)}&key=${apiKey}`
    );
    const result = await response.json();
    if (result.results && result.results.length > 0) {
      return result.results[0].geometry;
    }
    return null;
  };

  useEffect(() => {
    const fetchCoords = async () => {
      const from = await getCoords("Mumbai");
      const to = await getCoords("Chennai");

      setFromCoords(from);
      setToCoords(to);
    };
    fetchCoords();
  }, []);

  function FlowOverlay() {
  const map = useMap();

  useEffect(() => {
    if (!map || !fromCoords || !toCoords) return;

    const fromPoint = map.latLngToContainerPoint([fromCoords.lat, fromCoords.lng]);
    const toPoint = map.latLngToContainerPoint([toCoords.lat, toCoords.lng]);

    const reactflowNodes = [
      {
        id: "from",
        position: { x: fromPoint.x, y: fromPoint.y },
        data: { label: "From: Mumbai" },
        type: "default",
        style: {width: 100, height: 35}
      },
      {
        id: "to",
        position: { x: toPoint.x, y: toPoint.y },
        data: { label: "To: Chennai" },
        type: "default",
        style: {width: 100, height: 35}
      },
    ];

    const reactflowEdges = [
      {
        id: "e1-2",
        source: "from",
        target: "to",
        animated: true,
      },
    ];

    // Only update if coordinates have changed
    setNodes((prevNodes) => {
      const same = JSON.stringify(prevNodes) === JSON.stringify(reactflowNodes);
      return same ? prevNodes : reactflowNodes;
    });

    setEdges((prevEdges) => {
      const same = JSON.stringify(prevEdges) === JSON.stringify(reactflowEdges);
      return same ? prevEdges : reactflowEdges;
    });

  }, [map, fromCoords, toCoords]);

  return null;
}


  return (
    <div style={{ height: "90vh", width: "100%", position: "relative" }}>
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{ height: "100%", width: "100%", zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {fromCoords && (
          <Marker position={[fromCoords.lat, fromCoords.lng]}>
            <Popup><strong>Mumbai</strong></Popup>
          </Marker>
        )}
        {toCoords && (
          <Marker position={[toCoords.lat, toCoords.lng]}>
            <Popup><strong>Chennai</strong></Popup>
          </Marker>
        )}
        <FlowOverlay />
      </MapContainer>

      {/* React Flow overlay on top of map */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: "100%",
          width: "100%",
          pointerEvents: "none",
          zIndex: 2,
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          zoomOnScroll={false}
          panOnDrag={false}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
