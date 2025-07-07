import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap,} from "react-leaflet";
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

export default function Visualize() {
  const [fromCoords, setFromCoords] = useState([]);
  const [toCoordsList, setToCoordsList] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  let navigate = useNavigate();

  const routeReactFlow = () => {
    navigate("/Reactflow");
  };

  const getCoords = async (place) => {
    const apiKey = "6c331e8e8fc24d71ac3553394860b032"; // Replace with your key
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
        place
      )}&key=${apiKey}`
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
      const toPlaces = ["Chennai", "Bangalore", "Hyderabad"];
      const toCoords = await Promise.all(toPlaces.map(getCoords));
      setFromCoords(from);
      setToCoordsList(
        toCoords.map((coord, idx) => ({
          ...coord,
          label: toPlaces[idx],
        }))
      );
    };
    fetchCoords();
  }, []);

  function FlowOverlay() {
    const map = useMap();

    const updateNodePositions = () => {
      if (!map || !fromCoords || toCoordsList.length === 0) return;

      const OFFSET_Y = 40;
      const fromPoint = map.latLngToContainerPoint([
        fromCoords.lat,
        fromCoords.lng,
      ]);

      const newNodes = [
        {
          id: "from",
          position: {
            x: fromPoint.x,
            y: fromPoint.y - OFFSET_Y,
          },
          data: { label: "From: Mumbai" },
          type: "default",
          style: { width: 120, height: 35 },
        },
      ];

      const newEdges = [];

      toCoordsList.forEach((toCoord, idx) => {
        const toPoint = map.latLngToContainerPoint([toCoord.lat, toCoord.lng]);
        const toId = `to-${idx}`;

        // 🧮 Calculate real distance in km
        const distanceInKm =
          getDistance(
            { latitude: fromCoords.lat, longitude: fromCoords.lng },
            { latitude: toCoord.lat, longitude: toCoord.lng }
          ) / 1000;

        newNodes.push({
          id: toId,
          position: {
            x: toPoint.x,
            y: toPoint.y - OFFSET_Y,
          },
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
            type: "arrowclosed",
            width: 20,
            height: 20,
            color: "#000",
          },
          labelStyle: { fontSize: 12, fill: "#000000" },
        });
      });

      setNodes((prevNodes) => {
        const same = JSON.stringify(prevNodes) === JSON.stringify(newNodes);
        return same ? prevNodes : newNodes;
      });

      setEdges((prevEdges) => {
        const same = JSON.stringify(prevEdges) === JSON.stringify(newEdges);
        return same ? prevEdges : newEdges;
      });
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

  return (
    <>
      <button
        onClick={routeReactFlow}
        style={{
          backgroundColor: "rgb(35, 190, 198)",
          width: "100%",
          color: "white",
        }}
      >
        Flow View
      </button>
      <div style={{ height: "90vh", width: "100%", position: "relative" }}>
        <MapContainer
          center={[15.63, 77.31]}
          zoom={6}
          style={{ height: "100%", width: "100%", zIndex: 1 }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {fromCoords?.lat && fromCoords?.lng && (
            <Marker position={[fromCoords.lat, fromCoords.lng]}>
              <Popup>
                <strong>From: Mumbai</strong>
              </Popup>
            </Marker>
          )}

          {toCoordsList &&
            toCoordsList.map((coord, idx) => (
              <Marker key={idx} position={[coord.lat, coord.lng]}>
                <Popup>
                  <strong>{coord.label}</strong>
                </Popup>
              </Marker>
            ))}

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
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onEdgeMouseEnter={(event, edge) => {
              setHoveredEdge(edge);
            }}
            onEdgeMouseLeave={() => {
              setHoveredEdge(null);
            }}
            onMouseMove={(event) => {
              setCursorPos({ x: event.clientX, y: event.clientY });
            }}
            nodesDraggable={false}
            nodesConnectable={false}
            zoomOnScroll={false}
            panOnDrag={false}
          >
            <Background />
            <Controls />
          </ReactFlow>
          {hoveredEdge && (
            <div
              style={{
                position: "fixed",
                top: cursorPos.y + 10,
                left: cursorPos.x + 10,
                background: "#222",
                color: "#fff",
                padding: "6px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                pointerEvents: "none",
                zIndex: 1000,
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              🚚 <strong>Distance:</strong> {hoveredEdge.label}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
