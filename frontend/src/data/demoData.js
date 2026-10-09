export const seedIncidents = [
  { id: 'INC-01', title: 'Flood in Downtown', category: 'Flood', severity: 'Critical', status: 'Reported', locationName: 'Downtown', latitude: 34.0522, longitude: -118.2437, peopleAffected: 150, requiredResources: [], reportedAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'INC-02', title: 'Wildfire near Hills', category: 'Fire', severity: 'High', status: 'In Progress', locationName: 'Hollywood Hills', latitude: 34.1186, longitude: -118.3004, peopleAffected: 300, requiredResources: [], reportedAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'INC-03', title: 'Power Grid Failure', category: 'Infrastructure Failure', severity: 'Medium', status: 'Reported', locationName: 'East LA', latitude: 34.0305, longitude: -118.1584, peopleAffected: 1200, requiredResources: [], reportedAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'INC-04', title: 'Earthquake Damage', category: 'Earthquake', severity: 'Critical', status: 'Verified', locationName: 'Santa Monica', latitude: 34.0195, longitude: -118.4912, peopleAffected: 85, requiredResources: [], reportedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

export const seedResources = [];
export const seedNetworkNodes = [];
