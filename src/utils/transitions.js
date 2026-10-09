export const INCIDENT_TRANSITIONS = {
  reported: ['verified', 'assigned', 'in_progress', 'closed'],
  verified: ['assigned', 'in_progress', 'closed'],
  assigned: ['in_progress', 'verified', 'closed'],
  in_progress: ['resolved', 'assigned'],
  resolved: ['closed', 'in_progress'],
  closed: []
};

export const canTransitionIncident = (currentStatus, nextStatus, role) => {
  const allowedNext = INCIDENT_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(nextStatus)) return false;

  // Role restrictions on transitions
  if (role === 'operator') {
    // Operators shouldn't be resolving or assigning directly in most systems,
    // but the prompt said "limited". Let's restrict them from verifying or closing directly.
    if (['verified', 'closed', 'resolved'].includes(nextStatus)) return false;
  }

  if (nextStatus === 'closed' && role !== 'admin' && role !== 'coordinator') {
    return false;
  }

  if (currentStatus === 'resolved' && nextStatus === 'in_progress' && role !== 'admin' && role !== 'coordinator') {
    // Reopen restriction
    return false;
  }

  return true;
};
