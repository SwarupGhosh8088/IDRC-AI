import { Incident } from '../models/Incident.js';
import { Resource } from '../models/Resource.js';
import { Allocation } from '../models/Allocation.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    incidentStats,
    resourceStats,
    recentIncidents,
    allocationStats
  ] = await Promise.all([
    Incident.aggregate([
      { $match: { deletedAt: null } },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $in: ['$status', ['reported', 'verified', 'assigned', 'in_progress']] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        critical: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
        high: { $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] } }
      }}
    ]),
    Resource.aggregate([
      { $group: {
        _id: null,
        totalItems: { $sum: '$totalQuantity' },
        availableItems: { $sum: '$availableQuantity' },
        deployedItems: { $sum: '$deployedQuantity' },
        lowStockTypes: { $sum: { $cond: [{ $eq: ['$status', 'low_stock'] }, 1, 0] } },
        depletedTypes: { $sum: { $cond: [{ $eq: ['$status', 'depleted'] }, 1, 0] } }
      }}
    ]),
    Incident.find({ deletedAt: null }).sort('-reportedAt').limit(5).select('title severity status locationName reportedAt'),
    Allocation.aggregate([
      { $match: { status: 'deployed' } },
      { $group: {
        _id: '$resourceId',
        totalDeployed: { $sum: '$quantity' }
      }}
    ])
  ]);

  const incidents = incidentStats[0] || { total: 0, active: 0, resolved: 0, critical: 0, high: 0 };
  const resources = resourceStats[0] || { totalItems: 0, availableItems: 0, deployedItems: 0, lowStockTypes: 0, depletedTypes: 0 };

  // Simulated network data as requested by the prompt
  const network = {
    status: 'operational',
    activeNodes: 42,
    offlineNodes: 3,
    avgLatencyMs: 45,
    lastSync: new Date().toISOString(),
    isSimulated: true // Explicitly marked
  };

  res.status(200).json({
    success: true,
    data: {
      overview: {
        activeIncidents: incidents.active,
        criticalAlerts: incidents.critical + incidents.high,
        resourcesDeployed: resources.deployedItems,
        networkHealth: 92 // derived 42/45 * 100 approx
      },
      incidents,
      resources,
      recentIncidents,
      network
    }
  });
});

export const getNetworkNodes = asyncHandler(async (req, res) => {
  // Simulating network nodes mapping data
  const nodes = Array.from({ length: 45 }).map((_, i) => ({
    id: `node-${i + 1}`,
    name: `Relay Node ${i + 1}`,
    status: i < 3 ? 'offline' : (i < 8 ? 'degraded' : 'online'),
    batteryLevel: Math.floor(Math.random() * 60) + 40,
    signalStrength: Math.floor(Math.random() * 40) + 60,
    lastSeen: new Date(Date.now() - Math.floor(Math.random() * 10000)).toISOString(),
    coordinates: [
      -74.0060 + (Math.random() - 0.5) * 0.1, // Near NYC approx
      40.7128 + (Math.random() - 0.5) * 0.1
    ]
  }));

  res.status(200).json({
    success: true,
    data: {
      isSimulated: true,
      nodes
    }
  });
});

import { generateGlobalOverviewWithGemini } from '../services/aiService.js';

export const getDashboardAiOverview = asyncHandler(async (req, res) => {
  const activeIncidents = await Incident.find({ deletedAt: null, status: { $in: ['reported', 'verified', 'assigned', 'in_progress'] } })
    .sort('-severity') // assuming higher severity is first, but since severity is enum, maybe just get all active
    .limit(10)
    .select('title severity category locationName');

  if (!activeIncidents || activeIncidents.length === 0) {
    return res.status(200).json({ success: true, data: { globalSuggestion: "No active incidents. Systems are operating normally." }});
  }

  const aiResponse = await generateGlobalOverviewWithGemini(activeIncidents);
  
  res.status(200).json({ success: true, data: aiResponse });
});
