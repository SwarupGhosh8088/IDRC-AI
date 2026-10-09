import { Resource } from '../models/Resource.js';
import { Incident } from '../models/Incident.js';
import { Allocation } from '../models/Allocation.js';
import { InventoryMovement } from '../models/InventoryMovement.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Generates explainable, deterministic resource allocation recommendations.
 */
export const generateRecommendations = async (incidentId, actorId) => {
  const incident = await Incident.findById(incidentId);
  if (!incident) throw new ApiError(404, 'Incident not found', 'NOT_FOUND');
  
  if (incident.status === 'closed' || incident.status === 'resolved') {
    throw new ApiError(400, 'Cannot allocate resources to resolved or closed incidents', 'INVALID_STATE');
  }

  const recommendations = [];

  // Severity Weight
  const severityWeights = { critical: 100, high: 75, medium: 50, low: 25 };
  const baseScore = severityWeights[incident.severity] || 0;

  for (const req of incident.requiredResources) {
    // Find available resources matching category
    const resources = await Resource.find({
      category: req.category,
      status: { $in: ['available', 'low_stock'] },
      allocationEligible: true,
      availableQuantity: { $gt: 0 }
    }).sort({ availableQuantity: -1 }); // Prefer larger stockpiles

    let remainingNeeded = req.quantity;

    for (const res of resources) {
      if (remainingNeeded <= 0) break;

      // Calculate how many we can take
      const allocatable = Math.min(res.availableQuantity, remainingNeeded);
      if (allocatable === 0) continue;

      // Prevent over-recommending. Check existing non-cancelled/returned allocations
      const existingAllocations = await Allocation.find({
        incidentId: incident._id,
        resourceId: res._id,
        status: { $nin: ['cancelled', 'returned'] }
      });
      
      const alreadyAllocated = existingAllocations.reduce((acc, curr) => acc + curr.quantity, 0);
      if (alreadyAllocated >= allocatable) continue;

      const finalAllocatable = allocatable - alreadyAllocated;
      if (finalAllocatable <= 0) continue;

      const score = baseScore + (res.availableQuantity > res.lowStockThreshold ? 10 : 0) + Math.min(incident.peopleAffected, 50);

      const allocation = new Allocation({
        incidentId: incident._id,
        resourceId: res._id,
        quantity: finalAllocatable,
        status: 'recommended',
        priorityScore: score,
        rationale: `Matched ${finalAllocatable} ${res.unit} of ${res.name} (Category: ${req.category}) based on severity ${incident.severity} and availability.`,
        createdBy: actorId
      });

      await allocation.save();
      recommendations.push(allocation);

      remainingNeeded -= finalAllocatable;
    }
  }

  return recommendations;
};

/**
 * Approves an allocation and reserves inventory (Optimistic Concurrency Control)
 */
export const approveAllocation = async (allocationId, actorId) => {
  const allocation = await Allocation.findById(allocationId);
  if (!allocation) throw new ApiError(404, 'Allocation not found', 'NOT_FOUND');
  
  if (allocation.status !== 'recommended') {
    throw new ApiError(400, `Cannot approve allocation in ${allocation.status} state`, 'INVALID_STATE');
  }

  // Use optimistic concurrency via atomic update with condition
  const result = await Resource.findOneAndUpdate(
    {
      _id: allocation.resourceId,
      availableQuantity: { $gte: allocation.quantity }
    },
    {
      $inc: {
        availableQuantity: -allocation.quantity,
        reservedQuantity: allocation.quantity,
        version: 1
      },
      $set: { updatedBy: actorId }
    },
    { new: true }
  );

  if (!result) {
    throw new ApiError(409, 'Insufficient available quantity or concurrent modification', 'CONCURRENCY_ERROR');
  }

  allocation.status = 'approved';
  allocation.approvedBy = actorId;
  await allocation.save();

  await InventoryMovement.create({
    resourceId: result._id,
    type: 'reserve',
    quantity: allocation.quantity,
    allocationId: allocation._id,
    actorId,
    reason: `Reserved for incident ${allocation.incidentId}`,
    before: { available: result.availableQuantity + allocation.quantity, reserved: result.reservedQuantity - allocation.quantity, deployed: result.deployedQuantity, total: result.totalQuantity },
    after: { available: result.availableQuantity, reserved: result.reservedQuantity, deployed: result.deployedQuantity, total: result.totalQuantity }
  });

  return allocation;
};

export const deployAllocation = async (allocationId, actorId) => {
  const allocation = await Allocation.findById(allocationId);
  if (!allocation) throw new ApiError(404, 'Allocation not found', 'NOT_FOUND');
  
  if (allocation.status !== 'approved') {
    throw new ApiError(400, `Cannot deploy allocation in ${allocation.status} state`, 'INVALID_STATE');
  }

  const result = await Resource.findOneAndUpdate(
    {
      _id: allocation.resourceId,
      reservedQuantity: { $gte: allocation.quantity }
    },
    {
      $inc: {
        reservedQuantity: -allocation.quantity,
        deployedQuantity: allocation.quantity,
        version: 1
      },
      $set: { updatedBy: actorId }
    },
    { new: true }
  );

  if (!result) {
    throw new ApiError(409, 'Failed to deploy: reserved quantity mismatch', 'CONCURRENCY_ERROR');
  }

  allocation.status = 'deployed';
  allocation.deployedAt = new Date();
  await allocation.save();

  await InventoryMovement.create({
    resourceId: result._id,
    type: 'deploy',
    quantity: allocation.quantity,
    allocationId: allocation._id,
    actorId,
    reason: `Deployed to incident ${allocation.incidentId}`,
    before: { available: result.availableQuantity, reserved: result.reservedQuantity + allocation.quantity, deployed: result.deployedQuantity - allocation.quantity, total: result.totalQuantity },
    after: { available: result.availableQuantity, reserved: result.reservedQuantity, deployed: result.deployedQuantity, total: result.totalQuantity }
  });

  return allocation;
};
