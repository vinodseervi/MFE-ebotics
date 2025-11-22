// Mock data for the application

export const mockChecks = [
  {
    id: 1,
    depositDate: '05/11/2025',
    checkNumber: 'CHK-2025-001234',
    payer: 'Blue Cross Blue Shield',
    batchDescription: 'B-2025-11-001',
    exchange: 'Standard',
    totalAmount: 45230.5,
    posted: 45230.5,
    remaining: 0,
    status: 'Complete',
    clarifications: 0,
    unknown: 0,
    practice: 'Metro Health Center',
    location: 'Downtown Clinic',
    type: 'ERA',
    createdBy: 'Emily Davis',
    createdDate: '05/11/2025',
    updatedBy: 'Emily Davis',
    updatedDate: '05/11/2025',
    notes: 'Regular monthly payment - no issues'
  },
  {
    id: 2,
    depositDate: '06/11/2025',
    checkNumber: 'CHK-2025-001235',
    payer: 'Aetna',
    batchDescription: 'B-2025-11-002',
    exchange: 'Standard',
    totalAmount: 32150.75,
    posted: 28450.75,
    remaining: 3700,
    status: 'Under Clarification',
    clarifications: 1,
    unknown: 0,
    practice: 'Metro Health Center',
    location: 'Westside Facility',
    type: 'ERA',
    createdBy: 'Emily Davis',
    createdDate: '06/11/2025',
    updatedBy: 'Emily Davis',
    updatedDate: '06/11/2025',
    notes: ''
  },
  {
    id: 3,
    depositDate: '07/11/2025',
    checkNumber: 'CHK-2025-001236',
    payer: 'UnitedHealthcare',
    batchDescription: 'B-2025-11-003',
    exchange: 'Standard',
    totalAmount: 18900,
    posted: 0,
    remaining: 18900,
    status: 'In Progress',
    clarifications: 0,
    unknown: 0,
    practice: 'Family Care Associates',
    location: 'Main Office',
    type: 'ERA',
    createdBy: 'James Wilson',
    createdDate: '07/11/2025',
    updatedBy: 'James Wilson',
    updatedDate: '07/11/2025',
    notes: ''
  },
  {
    id: 4,
    depositDate: '08/11/2025',
    checkNumber: 'CHK-2025-001237',
    payer: 'Cigna',
    batchDescription: 'B-2025-11-004',
    exchange: 'Standard',
    totalAmount: 52340.25,
    posted: 52340.25,
    remaining: 0,
    status: 'Complete',
    clarifications: 0,
    unknown: 0,
    practice: 'Metro Health Center',
    location: 'North Campus',
    type: 'ERA',
    createdBy: 'Emily Davis',
    createdDate: '08/11/2025',
    updatedBy: 'Emily Davis',
    updatedDate: '08/11/2025',
    notes: ''
  },
  {
    id: 5,
    depositDate: '09/11/2025',
    checkNumber: 'CHK-2025-001238',
    payer: 'Medicare',
    batchDescription: 'B-2025-11-005',
    exchange: 'Standard',
    totalAmount: 125500,
    posted: 98230.5,
    remaining: 27269.5,
    status: 'Under Clarification',
    clarifications: 1,
    unknown: 0,
    practice: 'Family Care Associates',
    location: 'East Branch',
    type: 'ERA',
    createdBy: 'James Wilson',
    createdDate: '09/11/2025',
    updatedBy: 'James Wilson',
    updatedDate: '09/11/2025',
    notes: ''
  },
  {
    id: 6,
    depositDate: '10/11/2025',
    checkNumber: 'CHK-2025-001239',
    payer: 'Humana',
    batchDescription: 'B-2025-11-006',
    exchange: 'Standard',
    totalAmount: 8750,
    posted: 0,
    remaining: 8750,
    status: 'Not Started',
    clarifications: 0,
    unknown: 0,
    practice: 'Metro Health Center',
    location: 'Downtown Clinic',
    type: 'ERA',
    createdBy: 'Emily Davis',
    createdDate: '10/11/2025',
    updatedBy: 'Emily Davis',
    updatedDate: '10/11/2025',
    notes: ''
  }
];

export const dashboardStats = {
  expectedAmount: 282871.5,
  expectedChecks: 6,
  postedAmount: 224252,
  postedPercentage: 79.3,
  clarificationAmount: 30969.5,
  clarificationChecks: 2,
  pendingAmount: 8750,
  avgDaysToProcess: 3.2
};

export const trendData = [
  { month: 'Jul', expected: 280000, posted: 275000 },
  { month: 'Aug', expected: 290000, posted: 285000 },
  { month: 'Sep', expected: 300000, posted: 295000 },
  { month: 'Oct', expected: 310000, posted: 300000 },
  { month: 'Nov', expected: 282871.5, posted: 224252 }
];

export const statusDistribution = [
  { name: 'Complete', value: 2, color: '#10b981' },
  { name: 'Clarification', value: 2, color: '#f59e0b' },
  { name: 'In Progress', value: 1, color: '#3b82f6' },
  { name: 'Not Started', value: 1, color: '#6b7280' }
];

export const users = [
  {
    id: 1,
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'superadmin@ebotics.com',
    clientUserName: 'sjohnson',
    clientId: 'CLI001',
    role: 'Super Admin',
    practices: 3,
    status: 'Active',
    lastLogin: '10/11/2025',
    initial: 'S'
  },
  {
    id: 2,
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'admin@ebotics.com',
    clientUserName: 'mchen',
    clientId: 'CLI002',
    role: 'Admin',
    practices: 3,
    status: 'Active',
    lastLogin: '10/11/2025',
    initial: 'M'
  },
  {
    id: 3,
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'manager@ebotics.com',
    clientUserName: 'edavis',
    clientId: 'CLI003',
    role: 'Manager',
    practices: 2,
    status: 'Active',
    lastLogin: '09/11/2025',
    initial: 'E'
  },
  {
    id: 4,
    firstName: 'James',
    lastName: 'Wilson',
    email: 'supervisor@ebotics.com',
    clientUserName: 'jwilson',
    clientId: 'CLI004',
    role: 'Supervisor',
    practices: 1,
    status: 'Active',
    lastLogin: '09/11/2025',
    initial: 'J'
  },
  {
    id: 5,
    firstName: 'Lisa',
    lastName: 'Martinez',
    email: 'auditor@ebotics.com',
    clientUserName: 'lmartinez',
    clientId: 'CLI005',
    role: 'Auditor',
    practices: 3,
    status: 'Active',
    lastLogin: '08/11/2025',
    initial: 'L'
  },
  {
    id: 6,
    firstName: 'David',
    lastName: 'Park',
    email: 'analyst@ebotics.com',
    clientUserName: 'dpark',
    clientId: 'CLI006',
    role: 'Data Analyst',
    practices: 2,
    status: 'Active',
    lastLogin: '10/11/2025',
    initial: 'D'
  }
];

export const practices = [
  {
    id: 1,
    name: 'Metro Health Center',
    code: 'MHC',
    status: 'Active',
    locations: [
      { id: 1, name: 'Downtown Clinic', code: 'DTC', status: 'Active' },
      { id: 2, name: 'Westside Facility', code: 'WSF', status: 'Active' },
      { id: 3, name: 'North Campus', code: 'NTC', status: 'Active' }
    ]
  },
  {
    id: 2,
    name: 'Family Care Associates',
    code: 'FCA',
    status: 'Active',
    locations: [
      { id: 4, name: 'Main Office', code: 'MO', status: 'Active' },
      { id: 5, name: 'East Branch', code: 'EB', status: 'Active' }
    ]
  },
  {
    id: 3,
    name: 'Community Medical Group',
    code: 'CMG',
    status: 'Active',
    locations: [
      { id: 6, name: 'Central Office', code: 'CO', status: 'Active' },
      { id: 7, name: 'South Clinic', code: 'SC', status: 'Active' }
    ]
  }
];

export const roles = [
  {
    id: 1,
    name: 'Super Admin',
    description: 'Complete system access with all administrative privileges',
    users: 1,
    permissions: ['All System Permissions', 'Manage All Users', 'System Configuration', 'Full Access']
  },
  {
    id: 2,
    name: 'Admin',
    description: 'Full system access with user and practice management',
    users: 1,
    permissions: ['All Permissions', 'User Management', 'Practice Management', 'Check Management']
  },
  {
    id: 3,
    name: 'Manager',
    description: 'Manage checks, approve reconciliations, view reports',
    users: 1,
    permissions: ['Create/Edit/Delete Checks', 'Manage Clarifications', 'Approve Reconciliations', 'View Reports', 'Export Data']
  },
  {
    id: 4,
    name: 'Supervisor',
    description: 'Oversee daily operations and monitor team performance',
    users: 1,
    permissions: ['View All Checks', 'Assign Tasks', 'Monitor Performance', 'View Reports']
  },
  {
    id: 5,
    name: 'Auditor',
    description: 'Read-only access with full audit capabilities',
    users: 1,
    permissions: ['View All Data', 'View Audit Trail', 'Export Reports']
  },
  {
    id: 6,
    name: 'Data Analyst',
    description: 'Analytics and reporting with data export capabilities',
    users: 1,
    permissions: ['View Reports', 'Export Data', 'View Analytics']
  }
];

