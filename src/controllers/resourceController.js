import { Resource } from '../models/Resource.js';
import { InventoryMovement } from '../models/InventoryMovement.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createResource = asyncHandler(async (req, res) => {
  const payload = req.body;

  // default consumable based on category if not provided
  if (payload.consumable === undefined) {
    payload.consumable = ['Medical supplies', 'Food and water', 'Shelter supplies'].includes(payload.category);
  }

  const resource = new Resource({
    ...payload,
    availableQuantity: payload.totalQuantity,
    updatedBy: req.user._id
  });

  await resource.save();

  await InventoryMovement.create({
    resourceId: resource._id,
    type: 'create',
    quantity: resource.totalQuantity,
    before: { available: 0, reserved: 0, deployed: 0, total: 0 },
    after: { available: resource.availableQuantity, reserved: 0, deployed: 0, total: resource.totalQuantity },
    actorId: req.user._id,
    reason: 'Initial creation'
  });

  res.status(201).json({ success: true, data: resource });
});

export const getResources = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, category, status, location, q, sort = '-updatedAt' } = req.query;

  const query = {};

  if (category) query.category = { $in: category.split(',') };
  if (status) query.status = { $in: status.split(',') };
  if (location) query.storageLocation = new RegExp(location, 'i');
  
  if (q) {
    query.$or = [
      { name: new RegExp(q, 'i') },
      { description: new RegExp(q, 'i') }
    ];
  }

  const allowedSorts = ['name', '-name', 'category', 'availableQuantity', '-availableQuantity', 'updatedAt', '-updatedAt', 'status'];
  const sortObj = {};
  if (allowedSorts.includes(sort)) {
    sortObj[sort.replace('-', '')] = sort.startsWith('-') ? -1 : 1;
  } else {
    sortObj.updatedAt = -1;
  }
  sortObj._id = 1;

  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));

  const [resources, total] = await Promise.all([
    Resource.find(query).sort(sortObj).skip((p - 1) * l).limit(l),
    Resource.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    data: resources,
    pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) }
  });
});

export const getResourceById = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) throw new ApiError(404, 'Resource not found', 'NOT_FOUND');
  res.status(200).json({ success: true, data: resource });
});

export const updateResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) throw new ApiError(404, 'Resource not found', 'NOT_FOUND');

  // If changing status to retired/unavailable, ensure no active deployments/reservations
  if (req.body.status && ['retired', 'unavailable'].includes(req.body.status)) {
    if (resource.reservedQuantity > 0 || resource.deployedQuantity > 0) {
      throw new ApiError(409, 'Cannot retire resource with active reservations or deployments', 'INVALID_TRANSITION');
    }
    // Also effectively zero out availability logically if desired, but we let status handle it.
  }

  Object.assign(resource, req.body);
  resource.updatedBy = req.user._id;
  resource.version += 1;
  
  await resource.save();

  res.status(200).json({ success: true, data: resource });
});

export const adjustInventory = asyncHandler(async (req, res) => {
  const { adjustment, reason } = req.body;
  const resource = await Resource.findById(req.params.id);
  if (!resource) throw new ApiError(404, 'Resource not found', 'NOT_FOUND');

  const before = {
    available: resource.availableQuantity,
    reserved: resource.reservedQuantity,
    deployed: resource.deployedQuantity,
    total: resource.totalQuantity
  };

  if (adjustment < 0 && resource.availableQuantity + adjustment < 0) {
    throw new ApiError(409, 'Insufficient inventory to apply adjustment', 'INSUFFICIENT_INVENTORY');
  }

  resource.totalQuantity += adjustment;
  resource.availableQuantity += adjustment;
  resource.updatedBy = req.user._id;
  resource.version += 1;

  await resource.save();

  await InventoryMovement.create({
    resourceId: resource._id,
    type: 'adjustment',
    quantity: adjustment,
    before,
    after: {
      available: resource.availableQuantity,
      reserved: resource.reservedQuantity,
      deployed: resource.deployedQuantity,
      total: resource.totalQuantity
    },
    actorId: req.user._id,
    reason
  });

  res.status(200).json({ success: true, data: resource });
});

export const deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) throw new ApiError(404, 'Resource not found', 'NOT_FOUND');

  if (resource.reservedQuantity > 0 || resource.deployedQuantity > 0) {
    throw new ApiError(409, 'Cannot delete resource with active reservations or deployments', 'CONFLICT');
  }

  await Resource.deleteOne({ _id: resource._id });
  res.status(204).send();
});
