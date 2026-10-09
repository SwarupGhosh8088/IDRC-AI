import { z } from 'zod';

export const generateRecommendationSchema = z.object({
  body: z.object({
    incidentId: z.string().length(24) // valid objectid
  })
});

export const updateAllocationStatusSchema = z.object({
  params: z.object({ id: z.string().length(24) }),
  body: z.object({
    status: z.enum(['approved', 'deployed', 'returned', 'cancelled']),
    reason: z.string().optional()
  })
});
