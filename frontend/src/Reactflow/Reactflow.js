import React, { useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { useNavigate, useLocation } from "react-router-dom";

export default function Reactflow() {
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  
  const location = useLocation();

  const [nodes, setNodes] = useState(location.state?.nodes || []);
  const [edges, setEdges] = useState(location.state?.edges || []);


  let navigate = useNavigate();

  const handleBack = async () => {
    navigate("/Visualize");
  };

  useEffect(() => {
    if (!location.state?.nodes || !location.state?.edges) {
      navigate("/Visualize"); // redirect back
    }
  }, []);


  return (
    <>
      <button
        onClick={handleBack}
        style={{
          backgroundColor: "rgb(148, 156, 156)",
          width: "100%",
          color: "whitesmoke",
        }}
      >
        Combined View
      </button>

      <div style={{ height: "90vh", width: "100%", border: "2px solid black" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          panOnScroll
          zoomOnScroll
          nodesDraggable={false}
          nodesConnectable={false}
          onEdgeMouseEnter={(event, edge) => setHoveredEdge(edge)}
          onEdgeMouseLeave={() => setHoveredEdge(null)}
          onMouseMove={(e) => setCursorPos({ x: e.clientX, y: e.clientY })}
        >
          <Background />
          <Controls />
        </ReactFlow>

        {/* Tooltip for hovered edge */}
        {hoveredEdge && (
          <div
            style={{
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
            }}
          >
            <div>
              <strong>🚛 Truck Type:</strong> {hoveredEdge.data?.truckType}
            </div>
            <div>
              <strong>🛻 No. of Trucks:</strong> {hoveredEdge.data?.numTrucks}
            </div>
            <div>
              <strong>📏 Distance:</strong> {hoveredEdge.label}
            </div>
            <div>
              <strong>🌿 Emissions:</strong> {hoveredEdge.data?.emissions} kg CO₂
            </div>
          </div>
        )}
      </div>
    </>
  );
}
