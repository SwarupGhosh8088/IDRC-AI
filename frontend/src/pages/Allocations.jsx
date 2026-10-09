import React, { useState, useEffect } from 'react';
import { Navigation2, Clock, MapPin, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { incidentService } from '../services/incidentService';
import { resourceService } from '../services/resourceService';

export default function Allocations() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allocatingId, setAllocatingId] = useState(null);

  const fetchIncidents = async () => {
    try {
      const data = await incidentService.getIncidents();
      // Show incidents that are active
      setIncidents(data.filter(i => !['resolved', 'closed'].includes(i.status)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleAllotHelp = async (incident) => {
    try {
      setAllocatingId(incident.id || incident._id);
      
      // 1. Fetch available resources
      const allResources = await resourceService.getResources();
      
      // 2. Extract needed resources (from AI or defaults)
      const required = incident.aiAnalysis?.suggestedResources || [];
      
      // 3. Deduct from inventory
      for (const req of required) {
        // Simple match on category
        const availableMatch = allResources.find(r => 
           r.category.toLowerCase().includes(req.category.toLowerCase()) && 
           r.availableQuantity > 0
        );
        
        if (availableMatch) {
            const deduction = Math.min(req.quantity, availableMatch.availableQuantity);
            await resourceService.adjustInventory(
              availableMatch.id || availableMatch._id, 
              -deduction, 
              `Dispatched to: ${incident.title}`
            );
        }
      }

      await incidentService.updateIncidentStatus(incident.id || incident._id, 'in_progress', 'Help allocated by Operations');
      fetchIncidents();
    } catch (err) {
      console.error(err);
      alert('Failed to allocate help');
    } finally {
      setAllocatingId(null);
    }
  };

  const defaultPosition = [22.5726, 88.3639]; // default to kolkata region

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-textPrimary">Allocation Results</h2>
        <p className="text-textSecondary text-sm mt-1">Review AI-optimized resource distribution routes.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Map Area */}
        <div className="lg:col-span-2 rounded-xl flex items-center justify-center relative overflow-hidden h-full min-h-[300px] border border-borderSubtle z-0">
          <MapContainer center={defaultPosition} zoom={5} style={{ height: '100%', width: '100%' }}>
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
            {/* Dynamic Incident Markers */}
            {incidents.map(inc => (
              inc.latitude && inc.longitude ? (
                <Marker key={inc.id || inc._id} position={[inc.latitude, inc.longitude]}>
                  <Popup>
                    <strong>{inc.title}</strong><br/>
                    {inc.locationName}<br/>
                    Status: {inc.status}
                  </Popup>
                </Marker>
              ) : null
            ))}
          </MapContainer>
        </div>

        {/* Incidents List */}
        <div className="bg-surface border border-borderSubtle rounded-xl p-5 overflow-y-auto flex flex-col h-full">
          <h3 className="font-bold text-lg mb-4">Pending Allocations</h3>
          
          <div className="space-y-4 flex-1">
            {loading ? (
              <div className="text-textSecondary text-sm">Loading...</div>
            ) : incidents.length === 0 ? (
              <div className="text-textSecondary text-sm">No active incidents requiring allocation.</div>
            ) : incidents.map((inc) => (
              <div key={inc.id || inc._id} className="p-4 border border-borderSubtle rounded-lg bg-surfaceSecondary/30">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 font-bold text-textPrimary truncate">
                    <AlertCircle size={16} className={inc.severity === 'critical' ? 'text-critical' : 'text-warning'} />
                    <span className="truncate">{inc.title}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-medium ${inc.status === 'in_progress' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                    {inc.status}
                  </span>
                </div>
                
                <div className="space-y-2 mt-4 text-sm">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-textSecondary min-w-[70px]">Location</span>
                    <span className="font-medium text-right truncate" title={inc.locationName}>{inc.locationName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textSecondary">Affected</span>
                    <span className="font-medium">{inc.peopleAffected}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textSecondary">Comms</span>
                    <span className={`font-medium ${
                      inc.aiAnalysis?.networkStatus === 'Offline' ? 'text-critical' : 
                      (inc.aiAnalysis?.networkStatus === 'Degraded' || inc.severity === 'critical') ? 'text-warning' : 
                      'text-success'
                    }`}>
                      {inc.aiAnalysis?.networkStatus || (inc.severity === 'critical' ? 'Degraded' : 'Optimal')}
                    </span>
                  </div>
                  
                  {/* Show Requirements / Dispatched */}
                  {inc.aiAnalysis?.suggestedResources?.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-borderSubtle">
                      <span className="text-textSecondary text-xs uppercase font-bold block mb-1">
                        {inc.status === 'in_progress' ? 'Dispatched Resources:' : 'Required Resources:'}
                      </span>
                      <ul className="text-xs space-y-1 text-textPrimary bg-surfaceSecondary/50 p-2 rounded">
                        {inc.aiAnalysis.suggestedResources.map((res, i) => (
                          <li key={i} className="flex justify-between">
                            <span>{res.category}</span>
                            <span className="font-bold">{res.quantity}x</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                {inc.status !== 'in_progress' ? (
                  <button onClick={() => handleAllotHelp(inc)} disabled={allocatingId === (inc.id || inc._id)} className="w-full mt-4 bg-primary hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    {allocatingId === (inc.id || inc._id) ? <Loader2 size={16} className="animate-spin" /> : 'Allot Help & Resources'}
                  </button>
                ) : (
                  <div className="w-full mt-4 bg-surface border border-success/30 text-success py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                    <CheckCircle size={16} /> Help Dispatched
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
