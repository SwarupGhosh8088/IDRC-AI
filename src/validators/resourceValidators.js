import { z } from 'zod';

export const createResourceSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    category: z.enum(['Medical supplies', 'Food and water', 'Rescue equipment', 'Shelter supplies', 'Transportation', 'Personnel']),
    description: z.string().optional(),
    totalQuantity: z.number().int().min(0),
    unit: z.string(),
    storageLocation: z.string(),
    lowStockThreshold: z.number().int().min(0).optional(),
    allocationEligible: z.boolean().optional(),
    consumable: z.boolean().optional()
  })
});

export const adjustResourceSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    adjustment: z.number().int(), // positive or negative
    reason: z.string().min(5)
  })
});

export const updateResourceSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    name: z.string().min(2).optional(),
    category: z.enum(['Medical supplies', 'Food and water', 'Rescue equipment', 'Shelter supplies', 'Transportation', 'Personnel']).optional(),
    description: z.string().optional(),
    unit: z.string().optional(),
    storageLocation: z.string().optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
    allocationEligible: z.boolean().optional(),
    consumable: z.boolean().optional(),
    status: z.enum(['unavailable', 'retired', 'available']).optional()
  })
});
