import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

export default function Visualize() {
  const [fromCoords, setFromCoords] = useState(null);
  const [toCoords, setToCoords] = useState(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/location", {
          method: "GET", // Or POST depending on backend route
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();

          const toLocation = data.toLocation;
          const fromLocation = data.fromLocation;

          const getCoords = async (place) => {
            const apiKey = "51a73799f5604e3dac6442e071773b32"; 
            const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(place)}&key=${apiKey}`);

            const result = await response.json();
            if (result.results && result.results.length > 0) {
              return result.results[0].geometry;
            }
            return null;
          };

          setToCoords(await getCoords(toLocation));
          setFromCoords(await getCoords(fromLocation));
        } else {
          console.error("Failed to load location data from backend");
        }
      } catch (err) {
        console.error("Error fetching locations:", err);
      }
    };

    fetchLocations();
  }, []);

  return (
    <MapContainer
      center={[23.5937, 80.9629]}
      zoom={6}
      style={{ height: "90vh", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {fromCoords && (
        <Marker position={[fromCoords.lat, fromCoords.lng]}>
          <Popup>
            <strong>FROM</strong>
          </Popup>
        </Marker>
      )}

      {toCoords && (
        <Marker position={[toCoords.lat, toCoords.lng]}>
          <Popup>
            <strong>TO</strong>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
