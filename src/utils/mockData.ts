export interface GateInfo {
  id: string;
  name: string;
  status: 'Open' | 'Closed' | 'Restricted';
  currentLoad: number;
  avgWaitMinutes: number;
  location: string;
}

export interface TransitInfo {
  type: 'Metro' | 'Bus' | 'Shuttle' | 'Parking';
  route: string;
  status: 'Normal' | 'Delayed' | 'Crowded';
  waitMinutes: number;
  nextArrival: string;
}

export interface IncidentReport {
  id: string;
  category: 'Crowd' | 'Facilities' | 'Security' | 'Medical';
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  location: string;
  description: string;
  reportedTime: string;
  status: 'Open' | 'Investigating' | 'Resolved';
  assignedStaff?: string;
  recommendedAction?: string;
}

export interface StaffTask {
  id: string;
  title: string;
  category: string;
  location: string;
  assignedTo?: string;
  status: 'Unassigned' | 'In Progress' | 'Completed';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: string;
}

export interface LeaderboardUser {
  rank: number;
  name: string;
  points: number;
  carbonSavedKg: number;
}

export const initialGates: GateInfo[] = [
  { id: 'gate-a', name: 'Gate A (North Entry)', status: 'Open', currentLoad: 35, avgWaitMinutes: 5, location: 'North Concourse' },
  { id: 'gate-b', name: 'Gate B (VIP East)', status: 'Open', currentLoad: 12, avgWaitMinutes: 2, location: 'East Club' },
  { id: 'gate-c', name: 'Gate C (East Entry)', status: 'Open', currentLoad: 88, avgWaitMinutes: 35, location: 'East Concourse' },
  { id: 'gate-d', name: 'Gate D (South Entry)', status: 'Open', currentLoad: 92, avgWaitMinutes: 45, location: 'South Concourse' },
  { id: 'gate-e', name: 'Gate E (West Entry - Wheelchair Friendly)', status: 'Open', currentLoad: 40, avgWaitMinutes: 8, location: 'West Concourse' },
  { id: 'gate-f', name: 'Gate F (Media / Staff)', status: 'Restricted', currentLoad: 15, avgWaitMinutes: 3, location: 'North-West Operations' },
  { id: 'gate-g', name: 'Gate G (North-East Entry)', status: 'Closed', currentLoad: 0, avgWaitMinutes: 0, location: 'North-East Gate' },
];

export const initialTransit: TransitInfo[] = [
  { type: 'Metro', route: 'Line 6 Express (Stadium Station)', status: 'Crowded', waitMinutes: 3, nextArrival: '2 mins' },
  { type: 'Metro', route: 'Line 2 Local (East Gate Station)', status: 'Normal', waitMinutes: 6, nextArrival: '5 mins' },
  { type: 'Bus', route: 'Downtown Shuttle Bus B12', status: 'Delayed', waitMinutes: 18, nextArrival: '14 mins' },
  { type: 'Shuttle', route: 'Outer Parking Lot Shuttle S1', status: 'Normal', waitMinutes: 5, nextArrival: '3 mins' },
  { type: 'Parking', route: 'Zone A & B (Public Parking)', status: 'Crowded', waitMinutes: 25, nextArrival: 'Full' },
  { type: 'Parking', route: 'Zone C (Accessibility & VIP)', status: 'Normal', waitMinutes: 2, nextArrival: '32 spots free' },
];

export const initialIncidents: IncidentReport[] = [
  {
    id: 'inc-001',
    category: 'Crowd',
    severity: 'MAJOR',
    location: 'Gate D (South Entry)',
    description: 'Sudden rush at Gate D turnstiles due to digital ticket scanner failure.',
    reportedTime: '20:01',
    status: 'Investigating',
    assignedStaff: 'Officer Ramirez',
    recommendedAction: 'Manually override turnstiles and deploy 3 ticket checkers with mobile validation units.'
  },
  {
    id: 'inc-002',
    category: 'Facilities',
    severity: 'MINOR',
    location: 'Section 104 Concession',
    description: 'Liquid spill on stairs leading to Section 104, causing slipping hazard.',
    reportedTime: '20:03',
    status: 'Open',
    recommendedAction: 'Dispatch sanitation team immediately with caution tape and mop.'
  },
  {
    id: 'inc-003',
    category: 'Medical',
    severity: 'CRITICAL',
    location: 'Row 14, Seat 22 (Section 212)',
    description: 'Fan experiencing severe heat exhaustion, breathing but dizzy.',
    reportedTime: '20:04',
    status: 'Open',
    recommendedAction: 'Deploy Medical Response Unit 3 to Section 212 Row 14. Clear path using staff channel.'
  }
];

export const initialTasks: StaffTask[] = [
  {
    id: 'task-1',
    title: 'Clean spill at Sec 104',
    category: 'Sanitation',
    location: 'Section 104 Stairs',
    status: 'Unassigned',
    priority: 'MEDIUM',
    createdAt: '20:03'
  },
  {
    id: 'task-2',
    title: 'Escort medical team to Sec 212',
    category: 'Security / Operations',
    location: 'Section 212 Entrance',
    status: 'In Progress',
    assignedTo: 'Officer Ramirez',
    priority: 'HIGH',
    createdAt: '20:04'
  },
  {
    id: 'task-3',
    title: 'Deliver mobile scanners to Gate D',
    category: 'IT / Operations',
    location: 'Gate D Ops Center',
    status: 'Unassigned',
    priority: 'HIGH',
    createdAt: '20:02'
  },
  {
    id: 'task-4',
    title: 'Inspect Section 302 emergency exit gate',
    category: 'Safety Audit',
    location: 'Section 302 Lobby',
    status: 'Completed',
    assignedTo: 'Supervisor Chen',
    priority: 'LOW',
    createdAt: '19:15'
  }
];

export const sustainabilityLeaderboard: LeaderboardUser[] = [
  { rank: 1, name: 'Lucas M.', points: 1450, carbonSavedKg: 12.5 },
  { rank: 2, name: 'Sofia R.', points: 1280, carbonSavedKg: 11.0 },
  { rank: 3, name: 'Mateo G.', points: 1100, carbonSavedKg: 9.5 },
  { rank: 4, name: 'Amara O.', points: 950, carbonSavedKg: 8.2 },
  { rank: 5, name: 'Kenji Y.', points: 820, carbonSavedKg: 7.1 },
];
