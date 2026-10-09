import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, Plus, Truck, Tent, HeartPulse, Droplets, Loader2 } from 'lucide-react';
import { resourceService } from '../services/resourceService';
import Modal from '../components/common/Modal';

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', category: 'Medical supplies', unit: 'kits', totalQuantity: 0, storageLocation: '' });
  const [isCreating, setIsCreating] = useState(false);
  
  const [manageResource, setManageResource] = useState(null);
  const [adjustment, setAdjustment] = useState(0);
  const [reason, setReason] = useState('Restock');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [error, setError] = useState('');

  const fetchResources = async () => {
    try {
      setLoading(true);
      const data = await resourceService.getResources();
      setResources(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const getIcon = (cat) => {
    if (cat.includes('Medical')) return <HeartPulse size={16} className="text-textSecondary" />;
    if (cat.includes('Shelter')) return <Tent size={16} className="text-textSecondary" />;
    if (cat.includes('Food')) return <Droplets size={16} className="text-textSecondary" />;
    if (cat.includes('Rescue') || cat.includes('vehicle')) return <Truck size={16} className="text-textSecondary" />;
    return <Package size={16} className="text-textSecondary" />;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');
    try {
      await resourceService.createResource({
        ...createForm,
        totalQuantity: Number(createForm.totalQuantity),
        availableQuantity: Number(createForm.totalQuantity)
      });
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', category: 'Medical supplies', unit: 'kits', totalQuantity: 0, storageLocation: '' });
      fetchResources();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create resource');
    } finally {
      setIsCreating(false);
    }
  };

  const handleManageSubmit = async (e) => {
    e.preventDefault();
    setIsAdjusting(true);
    setError('');
    try {
      await resourceService.adjustInventory(manageResource._id || manageResource.id, Number(adjustment), reason);
      setManageResource(null);
      setAdjustment(0);
      setReason('Restock');
      fetchResources();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to adjust inventory');
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-textPrimary">Resource Management</h2>
          <p className="text-textSecondary text-sm mt-1">Track and manage emergency supplies, vehicles, and equipment.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary border border-borderSubtle hover:bg-borderSubtle text-textPrimary px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2">
          <Plus size={16} /> Add Resource
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" size={18} />
          <input 
            type="text" 
            placeholder="Search inventory..." 
            className="w-full bg-surface border border-borderSubtle text-textPrimary text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-borderSubtle rounded-lg text-sm font-medium text-textSecondary hover:text-textPrimary hover:bg-surfaceSecondary transition-colors">
          <Filter size={18} /> Filters
        </button>
      </div>

      <div className="bg-surface border border-borderSubtle rounded-xl overflow-x-auto min-h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center h-[300px] text-textSecondary">
            <Loader2 size={24} className="animate-spin mr-2"/> Loading resources...
          </div>
        ) : (
        <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
          <thead className="bg-surfaceSecondary text-textSecondary border-b border-borderSubtle">
            <tr>
              <th className="px-6 py-4 font-medium">Resource ID & Name</th>
              <th className="px-6 py-4 font-medium">Category</th>
              <th className="px-6 py-4 font-medium">Quantity</th>
              <th className="px-6 py-4 font-medium">Location</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderSubtle">
            {resources.map((res) => (
              <tr key={res.id || res._id} className="hover:bg-surfaceSecondary/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-textPrimary">{res.name}</div>
                  <div className="text-xs text-textSecondary">{res.id || (res._id ? res._id.substring(18,24).toUpperCase() : 'RES')}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-textSecondary">
                    {getIcon(res.category)}
                    {res.category}
                  </div>
                </td>
                <td className="px-6 py-4 text-textPrimary font-bold">{res.availableQuantity} / {res.totalQuantity} <span className="text-xs font-normal text-textSecondary">{res.unit}</span></td>
                <td className="px-6 py-4 text-textSecondary">{res.storageLocation}</td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold bg-surfaceSecondary text-textPrimary border border-borderSubtle`}>
                    {res.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => setManageResource(res)} className="text-primary hover:underline text-sm font-medium">Manage</button>
                </td>
              </tr>
            ))}
            {resources.length === 0 && (
              <tr><td colSpan="6" className="text-center py-6 text-textSecondary">No resources found</td></tr>
            )}
          </tbody>
        </table>
        )}
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Add New Resource">
        <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
          {error && <div className="text-critical text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-1">Name</label>
            <input required type="text" className="w-full bg-surface border border-borderSubtle rounded-md px-3 py-2 text-sm" value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} placeholder="e.g. Blankets"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1">Category</label>
              <select className="w-full bg-surface border border-borderSubtle rounded-md px-3 py-2 text-sm" value={createForm.category} onChange={e => setCreateForm({...createForm, category: e.target.value})}>
                <option value="Medical supplies">Medical supplies</option>
                <option value="Food and water">Food and water</option>
                <option value="Shelter supplies">Shelter supplies</option>
                <option value="Rescue equipment">Rescue equipment</option>
                <option value="Transportation">Transportation</option>
                <option value="Personnel">Personnel</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1">Unit</label>
              <input required type="text" className="w-full bg-surface border border-borderSubtle rounded-md px-3 py-2 text-sm" value={createForm.unit} onChange={e => setCreateForm({...createForm, unit: e.target.value})} placeholder="e.g. pallets, kits"/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1">Initial Quantity</label>
              <input required type="number" min="1" className="w-full bg-surface border border-borderSubtle rounded-md px-3 py-2 text-sm" value={createForm.totalQuantity} onChange={e => setCreateForm({...createForm, totalQuantity: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1">Storage Location</label>
              <input required type="text" className="w-full bg-surface border border-borderSubtle rounded-md px-3 py-2 text-sm" value={createForm.storageLocation} onChange={e => setCreateForm({...createForm, storageLocation: e.target.value})} placeholder="Warehouse A"/>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 bg-surfaceSecondary rounded-md text-sm">Cancel</button>
            <button type="submit" disabled={isCreating} className="px-4 py-2 bg-primary text-white rounded-md text-sm flex items-center">{isCreating ? <Loader2 className="animate-spin" size={16}/> : 'Add Resource'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!manageResource} onClose={() => setManageResource(null)} title={`Manage: ${manageResource?.name}`}>
        <form onSubmit={handleManageSubmit} className="space-y-4 mt-4">
          {error && <div className="text-critical text-sm">{error}</div>}
          <div className="bg-surfaceSecondary p-3 rounded text-sm text-textSecondary">
            Current Available: <strong className="text-textPrimary">{manageResource?.availableQuantity} {manageResource?.unit}</strong>
          </div>
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-1">Adjustment (+/-)</label>
            <input required type="number" className="w-full bg-surface border border-borderSubtle rounded-md px-3 py-2 text-sm" value={adjustment} onChange={e => setAdjustment(e.target.value)} placeholder="e.g. -5 or 20"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-1">Reason</label>
            <input required type="text" className="w-full bg-surface border border-borderSubtle rounded-md px-3 py-2 text-sm" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Restock, Damaged, Expired"/>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setManageResource(null)} className="px-4 py-2 bg-surfaceSecondary rounded-md text-sm">Cancel</button>
            <button type="submit" disabled={isAdjusting} className="px-4 py-2 bg-primary text-white rounded-md text-sm flex items-center">{isAdjusting ? <Loader2 className="animate-spin" size={16}/> : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
