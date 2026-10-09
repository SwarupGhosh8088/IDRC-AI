import { Incident } from '../models/Incident.js';
import { env } from '../config/env.js';

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function jaccardSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const set1 = new Set(str1.toLowerCase().split(/\s+/));
  const set2 = new Set(str2.toLowerCase().split(/\s+/));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

export const checkDuplicates = async (candidate) => {
  const windowHours = parseInt(env.DUPLICATE_WINDOW_HOURS || '24');
  const radiusKm = parseFloat(env.DUPLICATE_RADIUS_KM || '1');
  
  const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  // Base query: same category, reported recently, not closed/deleted
  const query = {
    category: candidate.category,
    reportedAt: { $gte: windowStart },
    status: { $ne: 'closed' },
    deletedAt: null
  };

  if (candidate.id) {
    query._id = { $ne: candidate.id };
  }

  const recentIncidents = await Incident.find(query).select('_id title normalizedLocation latitude longitude status');

  const matches = [];

  for (const inc of recentIncidents) {
    let isMatch = false;
    const reasons = ['Same category'];
    let score = 0;

    // Check location string equivalence
    const normalizedCandidateLoc = candidate.locationName ? candidate.locationName.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim() : '';
    if (normalizedCandidateLoc && normalizedCandidateLoc === inc.normalizedLocation) {
      isMatch = true;
      reasons.push('Exact location match');
      score += 50;
    }

    // Check spatial distance
    if (candidate.latitude && candidate.longitude && inc.latitude && inc.longitude) {
      const dist = haversineDistance(candidate.latitude, candidate.longitude, inc.latitude, inc.longitude);
      if (dist <= radiusKm) {
        isMatch = true;
        reasons.push(`Within ${radiusKm}km (${dist.toFixed(2)}km)`);
        score += 50;
      }
    }

    if (isMatch) {
      // Add text similarity as advisory signal
      const titleSim = jaccardSimilarity(candidate.title, inc.title);
      if (titleSim > 0.3) {
        reasons.push(`Title similarity ${(titleSim * 100).toFixed(0)}%`);
        score += Math.round(titleSim * 50);
      }

      matches.push({
        incident: { id: inc._id, title: inc.title, status: inc.status },
        score: Math.min(score, 100),
        reasons
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
};
