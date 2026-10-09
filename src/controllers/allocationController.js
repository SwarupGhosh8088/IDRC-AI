import { Allocation } from '../models/Allocation.js';
import { Resource } from '../models/Resource.js';
import { InventoryMovement } from '../models/InventoryMovement.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateRecommendations, approveAllocation, deployAllocation } from '../services/allocationEngine.js';

export const generate = asyncHandler(async (req, res) => {
  const { incidentId } = req.body;
  const recommendations = await generateRecommendations(incidentId, req.user._id);
  res.status(200).json({ success: true, data: recommendations });
});

export const getAllocations = asyncHandler(async (req, res) => {
  const { incidentId, resourceId, status } = req.query;
  const query = {};
  if (incidentId) query.incidentId = incidentId;
  if (resourceId) query.resourceId = resourceId;
  if (status) query.status = status;

  const allocations = await Allocation.find(query)
    .populate('incidentId', 'title severity status locationName')
    .populate('resourceId', 'name category unit storageLocation')
    .populate('createdBy approvedBy', 'name role')
    .sort('-createdAt');

  res.status(200).json({ success: true, data: allocations });
});

export const updateAllocationStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  const allocationId = req.params.id;

  if (status === 'approved') {
    const alloc = await approveAllocation(allocationId, req.user._id);
    return res.status(200).json({ success: true, data: alloc });
  }

  if (status === 'deployed') {
    const alloc = await deployAllocation(allocationId, req.user._id);
    return res.status(200).json({ success: true, data: alloc });
  }

  // Cancelled or returned logic
  const allocation = await Allocation.findById(allocationId);
  if (!allocation) throw new ApiError(404, 'Allocation not found', 'NOT_FOUND');

  if (status === 'cancelled') {
    if (['deployed', 'returned', 'cancelled'].includes(allocation.status)) {
      throw new ApiError(400, `Cannot cancel allocation in ${allocation.status} state`, 'INVALID_STATE');
    }

    if (allocation.status === 'approved') {
      // Must release reservation
      const result = await Resource.findOneAndUpdate(
        { _id: allocation.resourceId, reservedQuantity: { $gte: allocation.quantity } },
        { $inc: { reservedQuantity: -allocation.quantity, availableQuantity: allocation.quantity, version: 1 }, $set: { updatedBy: req.user._id } },
        { new: true }
      );

      if (!result) throw new ApiError(409, 'Failed to release reservation', 'CONCURRENCY_ERROR');

      await InventoryMovement.create({
        resourceId: result._id,
        type: 'release',
        quantity: allocation.quantity,
        allocationId: allocation._id,
        actorId: req.user._id,
        reason: reason || 'Allocation cancelled',
        before: { available: result.availableQuantity - allocation.quantity, reserved: result.reservedQuantity + allocation.quantity, deployed: result.deployedQuantity, total: result.totalQuantity },
        after: { available: result.availableQuantity, reserved: result.reservedQuantity, deployed: result.deployedQuantity, total: result.totalQuantity }
      });
    }

    allocation.status = 'cancelled';
    await allocation.save();
    return res.status(200).json({ success: true, data: allocation });
  }

  if (status === 'returned') {
    if (allocation.status !== 'deployed') {
      throw new ApiError(400, `Cannot return allocation in ${allocation.status} state`, 'INVALID_STATE');
    }

    const result = await Resource.findOneAndUpdate(
      { _id: allocation.resourceId, deployedQuantity: { $gte: allocation.quantity } },
      { $inc: { deployedQuantity: -allocation.quantity, availableQuantity: allocation.quantity, version: 1 }, $set: { updatedBy: req.user._id } },
      { new: true }
    );

    if (!result) throw new ApiError(409, 'Failed to return deployment', 'CONCURRENCY_ERROR');

    await InventoryMovement.create({
      resourceId: result._id,
      type: 'return',
      quantity: allocation.quantity,
      allocationId: allocation._id,
      actorId: req.user._id,
      reason: reason || 'Resource returned',
      before: { available: result.availableQuantity - allocation.quantity, reserved: result.reservedQuantity, deployed: result.deployedQuantity + allocation.quantity, total: result.totalQuantity },
      after: { available: result.availableQuantity, reserved: result.reservedQuantity, deployed: result.deployedQuantity, total: result.totalQuantity }
    });

    allocation.status = 'returned';
    allocation.returnedAt = new Date();
    await allocation.save();
    return res.status(200).json({ success: true, data: allocation });
  }

  throw new ApiError(400, 'Invalid status update', 'VALIDATION_ERROR');
});
