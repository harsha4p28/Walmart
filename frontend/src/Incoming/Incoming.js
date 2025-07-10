import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import debounce from "lodash/debounce";
import { getDistance } from "geolib";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

export default function Incoming() {
  const [toCoords, setToCoords] = useState(null);
  const [fromCoordsList, setFromCoordsList] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const getCoords = async (place) => {
    const apiKey = "6c331e8e8fc24d71ac3553394860b032";
    const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(place)}&key=${apiKey}`);
    const result = await response.json();
    return result.results?.[0]?.geometry || null;
  };

  const fetchEmissions = async (distanceKm, truckType = "large", numTrucks = 1) => {
    const emissionFactors = { small: 0.14, medium: 0.21, large: 0.35, electric: 0.05 };
    return distanceKm * emissionFactors[truckType] * numTrucks;
  };

  useEffect(() => {
    const savedTo = localStorage.getItem("incomingToCoords");
    const savedFrom = localStorage.getItem("incomingFromCoordsList");
    if (savedTo && savedFrom) {
      setToCoords(JSON.parse(savedTo));
      setFromCoordsList(JSON.parse(savedFrom));
    } else {
      const fetchAll = async () => {
        try {
          const warehouseRes = await fetch("http://localhost:5000/api/warehouse", {
            method: "GET",
            credentials: "include",
          });

          const warehouseData = await warehouseRes.json();
          const warehouseCoords = {
            lat: warehouseData.latitude,
            lng: warehouseData.longitude,
            label: "Warehouse",
          };
          setToCoords(warehouseCoords);
          localStorage.setItem("incomingToCoords", JSON.stringify(warehouseCoords));

          const shipmentsRes = await fetch("http://localhost:5000/api/shipments", {
            method: "GET",
            credentials: "include",
          });

          const shipmentsData = await shipmentsRes.json();

          const coordsPromises = shipmentsData.incoming.map(async (shipment) => {
            const coords = await getCoords(shipment.from_warehouse);
            return coords ? {
              lat: coords.lat,
              lng: coords.lng,
              label: shipment.from_warehouse,
              mode: shipment.mode,
              count: shipment.count
            } : null;
          });

          const resolvedCoords = (await Promise.all(coordsPromises)).filter(Boolean);
          setFromCoordsList(resolvedCoords);
          localStorage.setItem("incomingFromCoordsList", JSON.stringify(resolvedCoords));

        } catch (err) {
          console.error("Error fetching incoming data:", err);
        }
      };
      fetchAll();
    }
  }, []);

  function FlowOverlay() {
    const map = useMap();
    const updateNodePositions = async () => {
      if (!map || !toCoords || fromCoordsList.length === 0) return;

      const OFFSET_Y = 40;
      const toPoint = map.latLngToContainerPoint([toCoords.lat, toCoords.lng]);

      const newNodes = [
        {
          id: "to",
          position: { x: toPoint.x, y: toPoint.y - OFFSET_Y },
          data: { label: "To: Warehouse" },
          type: "default",
          style: { width: 120, height: 35 },
        },
      ];

      const newEdges = [];

      const emissionPromises = fromCoordsList.map(async (fromCoord, idx) => {
        const fromPoint = map.latLngToContainerPoint([fromCoord.lat, fromCoord.lng]);
        const fromId = `from-${idx}`;

        const distanceInKm = getDistance(
          { latitude: fromCoord.lat, longitude: fromCoord.lng },
          { latitude: toCoords.lat, longitude: toCoords.lng }
        ) / 1000;

        const emissions = await fetchEmissions(distanceInKm, fromCoord.mode, parseInt(fromCoord.count));

        let strokeColor = "#2ecc71";
        if (emissions > 800) strokeColor = "#e67e22";
        if (emissions > 1500) strokeColor = "#e74c3c";

        newNodes.push({
          id: fromId,
          position: { x: fromPoint.x, y: fromPoint.y - OFFSET_Y },
          data: { label: `From: ${fromCoord.label}` },
          type: "default",
          style: { width: 120, height: 35 },
        });

        newEdges.push({
          id: `e-${fromId}-to`,
          source: fromId,
          target: "to",
          label: `${distanceInKm.toFixed(2)} km`,
          animated: true,
          markerEnd: {
            type: "arrowclosed", width: 20, height: 20, color: "#000",
          },
          labelStyle: { fontSize: 12, fill: "#222" },
          style: { stroke: strokeColor, strokeWidth: 2.5 },
          data: {
            truckType: fromCoord.mode,
            numTrucks: fromCoord.count,
            emissions: emissions.toFixed(2),
          },
        });
      });

      await Promise.all(emissionPromises);
      setNodes(newNodes);
      setEdges(newEdges);
      localStorage.setItem("incomingNodes", JSON.stringify(newNodes));
      localStorage.setItem("incomingEdges", JSON.stringify(newEdges));
    };

    const debouncedUpdate = debounce(updateNodePositions, 100);

    useEffect(() => {
      map.on("zoom", debouncedUpdate);
      map.on("move", debouncedUpdate);
      return () => {
        map.off("zoom", debouncedUpdate);
        map.off("move", debouncedUpdate);
      };
    }, [map, toCoords, fromCoordsList]);

    return null;
  }

  useEffect(() => {
    const savedNodes = localStorage.getItem("incomingNodes");
    const savedEdges = localStorage.getItem("incomingEdges");
    if (savedNodes && savedEdges) {
      setNodes(JSON.parse(savedNodes));
      setEdges(JSON.parse(savedEdges));
    }
  }, []);

  return (
    <div style={{ height: "90vh", width: "100%", position: "relative" }}>
      <MapContainer center={[15.63, 77.31]} zoom={6} style={{ height: "100%", width: "100%", zIndex: 1 }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {toCoords && (
          <Marker position={[toCoords.lat, toCoords.lng]}>
            <Popup><strong>To: Warehouse</strong></Popup>
          </Marker>
        )}
        {fromCoordsList.map((coord, idx) => (
          <Marker key={idx} position={[coord.lat, coord.lng]}>
            <Popup><strong>{coord.label}</strong></Popup>
          </Marker>
        ))}
        <FlowOverlay />
      </MapContainer>

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
            position: "fixed", top: cursorPos.y + 10, left: cursorPos.x + 10,
            background: "#222", color: "#fff", padding: "8px 12px", borderRadius: "6px",
            fontSize: "12px", pointerEvents: "none", zIndex: 1000,
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
  );
}