import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { incidentService } from '../services/incidentService';
import L from 'leaflet';

// Fix for missing default markers in react-leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function MapView() {
  // Coordinates for India
  const defaultPosition = [20.5937, 78.9629];
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    incidentService.getIncidents().then(data => {
      setIncidents(data);
    }).catch(err => console.error(err));
  }, []);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Live Disaster Map</h2>
          <p className="text-textSecondary text-sm">Thermal Weather Map of India and real-time incident tracking.</p>
        </div>
      </div>
      
      <div className="flex-1 rounded-xl overflow-hidden border border-borderSubtle relative z-0">
        <MapContainer center={defaultPosition} zoom={5} style={{ height: '100%', width: '100%' }}>
          {/* Base OpenStreetMap Layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* OpenWeatherMap Temperature (Thermal) Layer */}
          <TileLayer
            attribution='&copy; <a href="https://openweathermap.org">OpenWeatherMap</a>'
            url="https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=6557810176c36fac5f0db536711a6c52"
            opacity={0.6}
          />
          
          {incidents.map(inc => {
            // Read coordinates from the database schema directly
            let lat = inc.latitude;
            let lng = inc.longitude;
            
            // If the user hasn't provided coordinates during creation, we'll auto-generate a fallback location in India for the demo map
            if (!lat || !lng) {
               // Generate deterministic pseudo-random coordinates based on incident ID string
               let pseudoRandom = 0;
               const idString = String(inc.id || inc._id || "");
               for (let i = 0; i < idString.length; i++) {
                 pseudoRandom += idString.charCodeAt(i);
               }
               lat = 20.5937 + (pseudoRandom % 10) - 5;
               lng = 78.9629 + ((pseudoRandom * 2) % 10) - 5;
            }

            return (
              <Marker key={inc.id || inc._id} position={[lat, lng]}>
                <Popup>
                  <div className="text-sm font-medium">{inc.title}</div>
                  <div className="text-xs text-red-500 font-bold capitalize">{inc.severity}</div>
                  <div className="text-xs">{inc.locationName}</div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
