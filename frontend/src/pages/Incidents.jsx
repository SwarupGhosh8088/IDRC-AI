import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Flag, MapPin, X, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { incidentService } from '../services/incidentService';
import Modal from '../components/common/Modal';

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [actionPlan, setActionPlan] = useState(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();

  // Create incident state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    category: 'Other',
    severity: 'low',
    locationName: '',
    city: '',
    state: '',
    country: '',
    peopleAffected: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const data = await incidentService.getIncidents();
      setIncidents(data);
    } catch (err) {
      console.error("Failed to load incidents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    // Check if query params say we should open the modal
    if (new URLSearchParams(location.search).get('action') === 'create') {
      setIsCreateModalOpen(true);
      // Remove query param without reloading
      navigate('/incidents', { replace: true });
    }
  }, [location.search, navigate]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const combinedLocation = `${createForm.locationName}, ${createForm.city}, ${createForm.state}, ${createForm.country}`;
      await incidentService.createIncident({
        ...createForm,
        locationName: combinedLocation,
        peopleAffected: Number(createForm.peopleAffected),
        locationCoordinates: {
          type: "Point",
          coordinates: [0, 0] // Defaulting to 0,0 for now as UI doesn't have a map picker yet
        }
      });
      setIsCreateModalOpen(false);
      setCreateForm({
        title: '', description: '', category: 'Other', severity: 'low', locationName: '', city: '', state: '', country: '', peopleAffected: 0
      });
      fetchIncidents();
    } catch (err) {
      if (err.response?.status === 409) {
        setError({
          message: err.response.data.message,
          aiRationale: err.response.data.data?.aiRationale
        });
      } else {
        setError({ message: err.response?.data?.message || 'Failed to create incident' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Incident Reports</h2>
          <p className="text-textSecondary text-sm">View, track, and manage all active emergencies.</p>
        </div>
        
        {/* Only allow standard users to see the Report Incident button */}
        {localStorage.getItem('resq_role') === 'User' && (
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary hover:bg-borderSubtle border border-borderSubtle text-textPrimary px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-all"
          >
            <Plus size={16} />
            Report incident
          </button>
        )}
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" />
          <input 
            type="text" 
            placeholder="Search by ID, location, or description..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-borderSubtle rounded-md pl-10 pr-4 py-2 text-sm text-textPrimary outline-none focus:border-primary"
          />
        </div>
        <button className="flex items-center gap-2 bg-surface border border-borderSubtle px-4 py-2 rounded-md text-sm hover:bg-surfaceSecondary transition-colors">
          <Filter size={16} />
          Filters
        </button>
      </div>

      <div className="bg-surface border border-borderSubtle rounded-xl overflow-x-auto min-h-[300px]">
        {loading ? (
           <div className="flex items-center justify-center h-[300px] text-textSecondary">
             <Loader2 size={24} className="animate-spin mr-2"/> Loading incidents...
           </div>
        ) : (
        <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
          <thead className="bg-surfaceSecondary text-textSecondary border-b border-borderSubtle">
            <tr>
              <th className="px-6 py-3 font-medium">ID / Title</th>
              <th className="px-6 py-3 font-medium">Severity</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Location</th>
              <th className="px-6 py-3 font-medium">Reported</th>
              <th className="px-6 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderSubtle">
            {incidents.filter(inc => !searchQuery || inc.title.toLowerCase().includes(searchQuery.toLowerCase()) || inc.locationName.toLowerCase().includes(searchQuery.toLowerCase()) || (inc.id || inc._id || '').toLowerCase().includes(searchQuery.toLowerCase())).map((inc, index) => (
              <tr key={inc.id || inc._id} className="hover:bg-surfaceSecondary/50 transition-colors animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="font-medium text-textPrimary flex items-center gap-1">
                        {inc.id || (inc._id ? inc._id.substring(18,24).toUpperCase() : 'INC')}
                      </div>
                      <div className="text-textSecondary text-xs">{inc.title}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-max bg-surfaceSecondary text-textPrimary border border-borderSubtle`}>
                    {inc.severity}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-surfaceSecondary text-textSecondary w-max border border-borderSubtle">
                    {inc.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-textSecondary">
                    <MapPin size={14} />
                    {inc.locationName}
                  </div>
                </td>
                <td className="px-6 py-4 text-textSecondary">
                  {new Date(inc.reportedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setSelectedIncident(inc)}
                      className="text-primary hover:underline text-sm font-medium"
                    >
                      View details
                    </button>
                    {(localStorage.getItem('resq_role') === 'Operator' || localStorage.getItem('resq_role') === 'User') && (
                      <button 
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to delete this incident?')) {
                            try {
                              await incidentService.deleteIncident(inc.id || inc._id);
                              fetchIncidents();
                            } catch (e) {
                              console.error("Failed to delete incident", e);
                              alert("Failed to delete incident");
                            }
                          }
                        }}
                        className="text-red-500 hover:underline text-sm font-medium"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {incidents.filter(inc => !searchQuery || inc.title.toLowerCase().includes(searchQuery.toLowerCase()) || inc.locationName.toLowerCase().includes(searchQuery.toLowerCase()) || (inc.id || inc._id || '').toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-textSecondary">
                  No incidents found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        )}
      </div>

      <Modal 
        isOpen={!!selectedIncident} 
        onClose={() => setSelectedIncident(null)}
        title={selectedIncident ? `Incident Details` : ''}
      >
        {selectedIncident && (
          <div className="space-y-6">
            
            {/* AI Insights Banner */}
            {selectedIncident.aiAnalysis && (
              <div className="bg-surfaceSecondary border border-borderSubtle rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-textPrimary font-bold mb-2 text-sm">
                  System Automated Analysis
                </div>
                <p className="text-sm text-textSecondary">
                  {selectedIncident.aiAnalysis.rationale}
                </p>
                {selectedIncident.aiAnalysis.suggestedResources?.length > 0 && (
                  <div className="mt-3">
                    <span className="text-xs font-semibold text-textPrimary uppercase">Suggested Resources:</span>
                    <ul className="list-disc pl-4 mt-1 text-xs text-textSecondary space-y-1">
                      {selectedIncident.aiAnalysis.suggestedResources.map((res, i) => (
                        <li key={i}>{res.quantity}x {res.category} ({res.rationale})</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedIncident.aiAnalysis.recommendedAction && (
                  <div className="mt-3 p-3 bg-primary/10 rounded border border-borderSubtle">
                    <span className="text-xs font-semibold text-primary uppercase block mb-1">Recommended Next Step:</span>
                    <span className="text-sm text-textPrimary">{selectedIncident.aiAnalysis.recommendedAction}</span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Title</label>
                <div className="text-textPrimary font-medium mt-1">{selectedIncident.title}</div>
              </div>
              <div>
                <label className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Category</label>
                <div className="text-textPrimary font-medium mt-1">{selectedIncident.category}</div>
              </div>
              <div>
                <label className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Severity</label>
                <div className={`mt-1 inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-surfaceSecondary text-textPrimary`}>
                  {selectedIncident.severity}
                </div>
              </div>
              <div>
                <label className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Status</label>
                <div className="text-textPrimary font-medium mt-1">{selectedIncident.status}</div>
              </div>
              <div>
                <label className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Location</label>
                <div className="text-textPrimary flex items-center gap-1 mt-1">
                  {selectedIncident.locationName}
                </div>
              </div>
              <div>
                <label className="text-xs text-textSecondary uppercase tracking-wider font-semibold">People Affected</label>
                <div className="text-textPrimary font-medium mt-1">{selectedIncident.peopleAffected}</div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-borderSubtle flex justify-end gap-3">
              {localStorage.getItem('resq_role') === 'Operator' && (
                <button 
                  onClick={async () => {
                    try {
                      setGeneratingPlan(true);
                      const plan = await incidentService.generateActionPlan(selectedIncident.id || selectedIncident._id);
                      setActionPlan(plan);
                    } catch (err) {
                      console.error("Failed to generate plan", err);
                    } finally {
                      setGeneratingPlan(false);
                    }
                  }}
                  disabled={generatingPlan}
                  className="px-4 py-2 bg-primary border border-borderSubtle text-textPrimary hover:bg-borderSubtle transition-colors rounded-md text-sm font-medium flex items-center gap-2"
                >
                  {generatingPlan && <Loader2 size={16} className="animate-spin" />}
                  Generate Action Plan
                </button>
              )}
              <button 
                onClick={() => { setSelectedIncident(null); setActionPlan(null); }}
                className="px-4 py-2 bg-surfaceSecondary text-textPrimary hover:bg-borderSubtle transition-colors rounded-md text-sm font-medium"
              >
                Close
              </button>
            </div>
            
            {actionPlan && (
              <div className="bg-surfaceSecondary border border-borderSubtle rounded-lg p-4 mt-4">
                <div className="font-bold text-sm text-textPrimary mb-3">Suggested Action Plan</div>
                
                {actionPlan.warnings?.length > 0 && (
                  <div className="mb-4">
                    <span className="text-xs font-semibold text-textPrimary uppercase">Warnings:</span>
                    <ul className="list-disc pl-4 mt-1 text-xs text-textSecondary space-y-1">
                      {actionPlan.warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}
                
                <div className="mb-4">
                  <span className="text-xs font-semibold text-textPrimary uppercase">Next Steps:</span>
                  <ul className="list-decimal pl-4 mt-1 text-xs text-textSecondary space-y-1">
                    {actionPlan.nextSteps.map((step, i) => <li key={i}>{step}</li>)}
                  </ul>
                </div>
                
                <div>
                  <span className="text-xs font-semibold text-textPrimary uppercase">Emergency Contacts:</span>
                  <ul className="list-disc pl-4 mt-1 text-xs text-textSecondary space-y-1">
                    {actionPlan.emergencyContacts.map((contact, i) => (
                      <li key={i}><strong>{contact.name}:</strong> {contact.number}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Report New Incident"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
          
          {/* AI Duplicate / Error Banner */}
          {error && (
            <div className="bg-surfaceSecondary border border-borderSubtle rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-textPrimary font-bold mb-1 text-sm">
                {error.message}
              </div>
              {error.aiRationale && (
                <div className="text-sm text-textSecondary mt-2">
                  <span className="font-semibold text-textPrimary flex items-center gap-1 mb-1">Automated Analysis:</span>
                  {error.aiRationale}
                </div>
              )}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-1">Title</label>
            <input required type="text" className="w-full bg-surface border border-borderSubtle rounded-md px-3 py-2 text-sm text-textPrimary" value={createForm.title} onChange={e => setCreateForm({...createForm, title: e.target.value})} placeholder="e.g. Flood at Main St"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-1">Description</label>
            <textarea required className="w-full bg-surface border border-borderSubtle rounded-md px-3 py-2 text-sm text-textPrimary" rows={3} value={createForm.description} onChange={e => setCreateForm({...createForm, description: e.target.value})} placeholder="Describe the situation..."></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1">Category</label>
              <select className="w-full bg-surface border border-borderSubtle rounded-md px-3 py-2 text-sm text-textPrimary" value={createForm.category} onChange={e => setCreateForm({...createForm, category: e.target.value})}>
                <option value="Flood">Flood</option>
                <option value="Fire">Fire</option>
                <option value="Earthquake">Earthquake</option>
                <option value="Medical Emergency">Medical Emergency</option>
                <option value="Infrastructure Failure">Infrastructure Failure</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1">Severity</label>
              <select className="w-full bg-surface border border-borderSubtle rounded-md px-3 py-2 text-sm text-textPrimary" value={createForm.severity} onChange={e => setCreateForm({...createForm, severity: e.target.value})}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1">Street / Exact Location</label>
              <input required type="text" className="w-full bg-surface border border-borderSubtle rounded-md px-3 py-2 text-sm text-textPrimary" value={createForm.locationName} onChange={e => setCreateForm({...createForm, locationName: e.target.value})} placeholder="e.g. 123 Main St"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1">City</label>
              <input required type="text" className="w-full bg-surface border border-borderSubtle rounded-md px-3 py-2 text-sm text-textPrimary" value={createForm.city} onChange={e => setCreateForm({...createForm, city: e.target.value})} placeholder="e.g. New York"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1">State</label>
              <input required type="text" className="w-full bg-surface border border-borderSubtle rounded-md px-3 py-2 text-sm text-textPrimary" value={createForm.state} onChange={e => setCreateForm({...createForm, state: e.target.value})} placeholder="e.g. NY"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1">Country</label>
              <input required type="text" className="w-full bg-surface border border-borderSubtle rounded-md px-3 py-2 text-sm text-textPrimary" value={createForm.country} onChange={e => setCreateForm({...createForm, country: e.target.value})} placeholder="e.g. USA"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1">People Affected (Est.)</label>
              <input required type="number" min="0" className="w-full bg-surface border border-borderSubtle rounded-md px-3 py-2 text-sm text-textPrimary" value={createForm.peopleAffected} onChange={e => setCreateForm({...createForm, peopleAffected: e.target.value})}/>
            </div>
          </div>
          <div className="pt-4 border-t border-borderSubtle flex justify-end gap-3">
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 bg-surfaceSecondary text-textPrimary hover:bg-borderSubtle transition-colors rounded-md text-sm font-medium">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary text-white hover:bg-blue-600 transition-colors rounded-md text-sm font-medium flex items-center gap-2 disabled:opacity-50">
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Report
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
