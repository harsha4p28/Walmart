import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import { getDistance } from "geolib";
import debounce from "lodash/debounce";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

export default function Fullmap() {
  const [fromCoords, setFromCoords] = useState(null);
  const [incomingList, setIncomingList] = useState([]);
  const [outgoingList, setOutgoingList] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/shipments", {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json();
        setIncomingList(data.incoming || []);
        setOutgoingList(data.outgoing || []);
      } catch (err) {
        console.error("Error fetching all shipments:", err);
      }
    };

    fetchAll();
  }, []);

  function FlowOverlay() {
    const map = useMap();

    const updateFlow = async () => {
      if (!map) return;

      const OFFSET_Y = 40;
      const newNodes = [];
      const newEdges = [];

      const makeNode = (id, label, lat, lng, color) => ({
        id,
        position: { x: map.latLngToContainerPoint([lat, lng]).x, y: map.latLngToContainerPoint([lat, lng]).y - OFFSET_Y },
        data: { label },
        type: "default",
        style: { width: 120, height: 35, background: color },
      });

      const makeEdge = (src, tgt, dist, data, stroke) => ({
        id: `e-${src}-${tgt}`,
        source: src,
        target: tgt,
        label: `${dist.toFixed(2)} km`,
        animated: true,
        markerEnd: { type: "arrowclosed", width: 20, height: 20, color: "#000" },
        labelStyle: { fontSize: 12, fill: "#222" },
        style: { stroke, strokeWidth: 2.5 },
        data,
      });

      const coordsMap = new Map(); // to avoid duplicate nodes

      const processList = (list, direction) => {
        for (let i = 0; i < list.length; i++) {
          const shipment = list[i];
          const fromId = `${direction}-from-${i}`;
          const toId = `${direction}-to-${i}`;
          const isIncoming = direction === "in";

          const fromLat = isIncoming ? shipment.lat : fromCoords?.lat;
          const fromLng = isIncoming ? shipment.lng : fromCoords?.lng;
          const toLat = isIncoming ? fromCoords?.lat : shipment.lat;
          const toLng = isIncoming ? fromCoords?.lng : shipment.lng;

          if (!fromLat || !fromLng || !toLat || !toLng) continue;

          const fromLabel = isIncoming ? shipment.from_warehouse : "Warehouse";
          const toLabel = isIncoming ? "Warehouse" : shipment.to_warehouse;

          const distance = getDistance({ latitude: fromLat, longitude: fromLng }, { latitude: toLat, longitude: toLng }) / 1000;

          if (!coordsMap.has(fromId)) {
            newNodes.push(makeNode(fromId, `From: ${fromLabel}`, fromLat, fromLng, "#eee"));
            coordsMap.set(fromId, true);
          }

          if (!coordsMap.has(toId)) {
            newNodes.push(makeNode(toId, `To: ${toLabel}`, toLat, toLng, "#eee"));
            coordsMap.set(toId, true);
          }

          const edgeColor = isIncoming ? "#3498db" : "#2ecc71";

          newEdges.push(makeEdge(
            fromId,
            toId,
            distance,
            {
              truckType: shipment.mode,
              numTrucks: shipment.count,
              emissions: shipment.emissions ?? 0,
              direction: isIncoming ? "Incoming" : "Outgoing",
            },
            edgeColor
          ));
        }
      };

      if (fromCoords) {
        processList(outgoingList, "out");
        processList(incomingList, "in");
        setNodes(newNodes);
        setEdges(newEdges);
      }
    };

    const debouncedUpdate = debounce(updateFlow, 100);

    useEffect(() => {
      map.on("zoom", debouncedUpdate);
      map.on("move", debouncedUpdate);
      return () => {
        map.off("zoom", debouncedUpdate);
        map.off("move", debouncedUpdate);
      };
    }, [map, fromCoords, incomingList, outgoingList]);

    useEffect(() => {
      const fetchWarehouseCoords = async () => {
        try {
          const res = await fetch("http://localhost:5000/api/warehouse", {
            method: "GET",
            credentials: "include",
          });
          const data = await res.json();
          setFromCoords({ lat: data.latitude, lng: data.longitude });
        } catch (err) {
          console.error("Error fetching warehouse coords:", err);
        }
      };
      fetchWarehouseCoords();
    }, []);

    return null;
  }

  return (
    <div style={{ height: "90vh", width: "100%", position: "relative" }}>
      <MapContainer center={[39, 34]} zoom={3} style={{ height: "100%", width: "100%", zIndex: 1 }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {fromCoords && (
          <Marker position={[fromCoords.lat, fromCoords.lng]}>
            <Popup><strong>Warehouse (You)</strong></Popup>
          </Marker>
        )}
        {[...incomingList, ...outgoingList].map((s, i) =>
          s.lat && s.lng ? (
            <Marker key={i} position={[s.lat, s.lng]}>
              <Popup><strong>{s.from_warehouse || s.to_warehouse}</strong></Popup>
            </Marker>
          ) : null
        )}
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
            <div><strong>🔁 Direction:</strong> {hoveredEdge.data?.direction}</div>
          </div>
        )}
      </div>
    </div>
  );
}
