
# Walmart Simulation Platform “Proactive Supply Chain Optimizer"

## Problem

Despite Walmart's adoption of AI for route and supply chain optimization, a critical gap remains between AI generated recommendations and their real world execution.

AI driven logistics routes often lack human insight, contextual adaptability, and sustainability awareness. This can lead to sub optimal routing, missed opportunities for shipment bundling, increased transportation costs, and unnecessary environmental impact. Currently, there's no system that allows managers to verify, simulate, or collaboratively optimize AI-proposed operations before they are executed resulting in a **reactive rather than proactive** supply chain model.

## Solution

We built a **simulation platform for managers** that acts as a validation layer between Walmart's AI recommendations and operational execution.

- Managers can **simulate and analyze** the routes suggested by Walmart's AI algorithms before implementation, enabling a **proactive decision making process**.  
- They can explore **intermediate routing opportunities**, propose bundled shipments, and collaborate with other managers via an integrated **approval workflow**.  
- During simulation, **AI assistance** helps managers evaluate route adjustments and ensures **accountability** through optimized, data driven insights.  
- Once verified and finalized, the simulation is **locked**, forming a traceable, collaborative, and environmentally accountable shipment plan.

## Tech Stack

- **Frontend**: React, React Leaflet, React Flow  
- **Backend**: Flask, Python  
- **Database**: MongoDB (with MongoEngine schema design)  
- **APIs**: Climatiq (pollution estimation), Gemini (AI suggestions)  

## Impact
 
- Increases **managerial accountability** and **inter-departmental collaboration**.  
- Reduces errors and **bridges the gap between AI suggestions and real-world feasibility**.  
- Promotes **sustainable operations** through pollution-aware logistics decisions. 