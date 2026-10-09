import { z } from 'zod';

const resourceReqSchema = z.object({
  category: z.string(),
  quantity: z.number().int().min(1)
});

export const createIncidentSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    description: z.string().min(5),
    category: z.enum(['Flood', 'Fire', 'Earthquake', 'Storm', 'Landslide', 'Medical Emergency', 'Infrastructure Failure', 'Other']),
    severity: z.enum(['critical', 'high', 'medium', 'low']),
    locationName: z.string().min(2),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    peopleAffected: z.number().int().min(0).default(0),
    requiredResources: z.array(resourceReqSchema).max(20).optional().default([]),
    reportedAt: z.string().datetime().optional(),
    externalRef: z.string().optional(),
    acknowledgeDuplicates: z.boolean().optional().default(false)
  }).refine(data => {
    return (data.latitude !== undefined && data.longitude !== undefined) || 
           (data.latitude === undefined && data.longitude === undefined);
  }, { message: "Both latitude and longitude must be provided together or neither." })
});

export const updateIncidentSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(5).optional(),
    category: z.enum(['Flood', 'Fire', 'Earthquake', 'Storm', 'Landslide', 'Medical Emergency', 'Infrastructure Failure', 'Other']).optional(),
    severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    locationName: z.string().min(2).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    peopleAffected: z.number().int().min(0).optional(),
    requiredResources: z.array(resourceReqSchema).max(20).optional()
  }).refine(data => {
    return (data.latitude !== undefined && data.longitude !== undefined) || 
           (data.latitude === undefined && data.longitude === undefined);
  }, { message: "Both latitude and longitude must be provided together or neither." })
});

export const updateIncidentStatusSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    status: z.enum(['verified', 'assigned', 'in_progress', 'resolved', 'closed']),
    summary: z.string().optional() // required if resolved
  })
});
