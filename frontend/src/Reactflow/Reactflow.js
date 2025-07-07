import React, { useEffect, useState } from "react";
import ReactFlow, { Background, Controls, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import { useNavigate } from "react-router-dom";

export default function Reactflow() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  let navigate = useNavigate();

  const handleBack = async () =>{
    navigate('/Visualize');
  }

  useEffect(() => {
    const fromX = 300;
    const fromY = 100;
    const spacing = 200;

    const cities = ["Hyderabad", "Bangalore", "Chennai"];

    const newNodes = [
      {
        id: "from",
        position: { x: fromX, y: fromY },
        data: { label: "From: Mumbai" },
        style: { width: 120, height: 35 },
      },
    ];

    const newEdges = [];

    cities.forEach((city, idx) => {
      const id = `to-${idx}`;
      const x = fromX - spacing + idx * spacing;
      const y = fromY + 150;

      newNodes.push({
        id,
        position: { x, y },
        data: { label: `To: ${city}` },
        style: { width: 120, height: 35 },
      });

      newEdges.push({
        id: `e-from-${id}`,
        source: "from",
        target: id,
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, []);

  return (
    <>
    <button onClick={handleBack}  style={{backgroundColor: "rgb(148, 156, 156)", width: "100%", color:"whitesmoke"}}>Combined View</button>
    <div style={{ height: "90vh", width: "100%", border: "2px solid black" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        panOnScroll
        zoomOnScroll
        nodesDraggable={false}
        nodesConnectable={false}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
    </>
  );
}
