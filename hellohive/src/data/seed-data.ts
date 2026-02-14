export type UserRole = 'admin' | 'ops-coordinator' | 'technician' | 'viewer' | 'vendor';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  organization: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  spaces: Space[];
}

export interface Space {
  id: string;
  propertyId: string;
  name: string;
  type: string;
  assets: Asset[];
}

export interface Asset {
  id: string;
  spaceId: string;
  name: string;
  type: string;
  model?: string;
}

export type VendorCategory = 'MEP' | 'Electrical' | 'Janitorial' | 'Security' | 'AV/Broadcast';

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  slaCompliance: number;
  avgResponseTime: number;
  contact: string;
  phone: string;
}

export type WorkOrderStatus = 'open' | 'in-progress' | 'completed' | 'overdue' | 'dispatched';
export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  propertyId: string;
  spaceId: string;
  assetId?: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  category: VendorCategory;
  assignedVendorId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cost?: number;
  assignedTechnicianId?: string;
}

export interface ActivityFeedItem {
  id: string;
  workOrderId: string;
  message: string;
  timestamp: string;
  userId: string;
}

// === USERS ===
export const users: User[] = [
  {
    id: 'user-1',
    name: 'Marcus Reyes',
    role: 'admin',
    email: 'marcus.reyes@mlbstudio.com',
    organization: 'MLB Studio Campus',
  },
  {
    id: 'user-2',
    name: 'Sarah Chen',
    role: 'ops-coordinator',
    email: 'sarah.chen@mlbstudio.com',
    organization: 'MLB Studio Campus',
  },
  {
    id: 'user-3',
    name: 'Derek Morales',
    role: 'technician',
    email: 'derek.morales@mlbstudio.com',
    organization: 'MLB Studio Campus',
  },
  {
    id: 'user-4',
    name: 'James Whitfield',
    role: 'viewer',
    email: 'james.whitfield@mlbstudio.com',
    organization: 'MLB Studio Campus',
  },
  {
    id: 'vendor-johnson',
    name: 'Johnson Controls',
    role: 'vendor',
    email: 'dispatch@johnsoncontrols.com',
    organization: 'Johnson Controls',
  },
];

// === PROPERTIES ===
export const properties: Property[] = [
  {
    id: 'prop-1',
    name: 'Broadcast Production Center',
    address: '1200 Stadium Way, Los Angeles, CA 90012',
    spaces: [
      {
        id: 'space-1-1',
        propertyId: 'prop-1',
        name: 'Sound Stage 3',
        type: 'Production',
        assets: [
          { id: 'asset-1-1-1', spaceId: 'space-1-1', name: 'HVAC Unit #RTU-04', type: 'HVAC', model: 'Carrier 50TC' },
          { id: 'asset-1-1-2', spaceId: 'space-1-1', name: 'Camera Rail A', type: 'Production Equipment' },
          { id: 'asset-1-1-3', spaceId: 'space-1-1', name: 'LED Wall Panel Array', type: 'Display' },
        ],
      },
      {
        id: 'space-1-2',
        propertyId: 'prop-1',
        name: 'Edit Suite 2',
        type: 'Post Production',
        assets: [
          { id: 'asset-1-2-1', spaceId: 'space-1-2', name: 'UPS-12', type: 'Power', model: 'APC Smart-UPS 3000' },
          { id: 'asset-1-2-2', spaceId: 'space-1-2', name: 'HVAC Zone Controller', type: 'HVAC' },
        ],
      },
      {
        id: 'space-1-3',
        propertyId: 'prop-1',
        name: 'Control Room A',
        type: 'Broadcast',
        assets: [
          { id: 'asset-1-3-1', spaceId: 'space-1-3', name: 'Broadcast Router Matrix', type: 'AV Equipment' },
          { id: 'asset-1-3-2', spaceId: 'space-1-3', name: 'Environmental Monitor', type: 'HVAC' },
        ],
      },
      {
        id: 'space-1-4',
        propertyId: 'prop-1',
        name: 'Server Room B',
        type: 'IT Infrastructure',
        assets: [
          { id: 'asset-1-4-1', spaceId: 'space-1-4', name: 'CRAC Unit #1', type: 'HVAC', model: 'Liebert DS' },
          { id: 'asset-1-4-2', spaceId: 'space-1-4', name: 'Fire Suppression Panel', type: 'Safety' },
        ],
      },
      {
        id: 'space-1-5',
        propertyId: 'prop-1',
        name: 'Loading Dock C',
        type: 'Operations',
        assets: [
          { id: 'asset-1-5-1', spaceId: 'space-1-5', name: 'Badge Reader #CD-03', type: 'Access Control' },
          { id: 'asset-1-5-2', spaceId: 'space-1-5', name: 'Overhead Door Motor', type: 'Mechanical' },
        ],
      },
    ],
  },
  {
    id: 'prop-2',
    name: 'Stadium Complex',
    address: '800 Stadium Plaza, Los Angeles, CA 90012',
    spaces: [
      {
        id: 'space-2-1',
        propertyId: 'prop-2',
        name: 'Press Box Level 3',
        type: 'Media Operations',
        assets: [
          { id: 'asset-2-1-1', spaceId: 'space-2-1', name: 'HVAC Zone Panel 7B', type: 'HVAC' },
        ],
      },
      {
        id: 'space-2-2',
        propertyId: 'prop-2',
        name: 'Broadcast Booth A',
        type: 'Broadcast',
        assets: [
          { id: 'asset-2-2-1', spaceId: 'space-2-2', name: 'Fiber Distribution Panel', type: 'Network' },
        ],
      },
      {
        id: 'space-2-3',
        propertyId: 'prop-2',
        name: 'Equipment Storage',
        type: 'Storage',
        assets: [],
      },
    ],
  },
  {
    id: 'prop-3',
    name: 'Training & Operations Facility',
    address: '450 Practice Drive, Los Angeles, CA 90012',
    spaces: [
      {
        id: 'space-3-1',
        propertyId: 'prop-3',
        name: 'Training Room 1',
        type: 'Education',
        assets: [
          { id: 'asset-3-1-1', spaceId: 'space-3-1', name: 'Projector System', type: 'AV Equipment' },
        ],
      },
      {
        id: 'space-3-2',
        propertyId: 'prop-3',
        name: 'Maintenance Shop',
        type: 'Operations',
        assets: [
          { id: 'asset-3-2-1', spaceId: 'space-3-2', name: 'Exhaust Fan System', type: 'HVAC' },
        ],
      },
    ],
  },
];

// === VENDORS ===
export const vendors: Vendor[] = [
  {
    id: 'vendor-1',
    name: 'Johnson Controls',
    category: 'MEP',
    slaCompliance: 98.2,
    avgResponseTime: 2.1,
    contact: 'David Kim',
    phone: '(323) 555-0101',
  },
  {
    id: 'vendor-2',
    name: 'Schneider Electric',
    category: 'MEP',
    slaCompliance: 95.8,
    avgResponseTime: 3.4,
    contact: 'Maria Santos',
    phone: '(323) 555-0102',
  },
  {
    id: 'vendor-3',
    name: 'Rosendin Electric',
    category: 'Electrical',
    slaCompliance: 96.5,
    avgResponseTime: 2.8,
    contact: 'Tom Rodriguez',
    phone: '(323) 555-0103',
  },
  {
    id: 'vendor-4',
    name: 'IES Holdings',
    category: 'Electrical',
    slaCompliance: 94.1,
    avgResponseTime: 4.2,
    contact: 'Jessica Lee',
    phone: '(323) 555-0104',
  },
  {
    id: 'vendor-5',
    name: 'ABM Industries',
    category: 'Janitorial',
    slaCompliance: 97.3,
    avgResponseTime: 1.5,
    contact: 'Carlos Mendez',
    phone: '(323) 555-0105',
  },
  {
    id: 'vendor-6',
    name: 'ISS Facility Services',
    category: 'Janitorial',
    slaCompliance: 93.7,
    avgResponseTime: 2.3,
    contact: 'Angela Park',
    phone: '(323) 555-0106',
  },
  {
    id: 'vendor-7',
    name: 'Allied Universal',
    category: 'Security',
    slaCompliance: 99.1,
    avgResponseTime: 0.8,
    contact: 'Marcus Johnson',
    phone: '(323) 555-0107',
  },
  {
    id: 'vendor-8',
    name: 'Convergint',
    category: 'Security',
    slaCompliance: 97.8,
    avgResponseTime: 1.2,
    contact: 'Lisa Chen',
    phone: '(323) 555-0108',
  },
  {
    id: 'vendor-9',
    name: 'Diversified',
    category: 'AV/Broadcast',
    slaCompliance: 96.9,
    avgResponseTime: 2.5,
    contact: 'Robert Turner',
    phone: '(323) 555-0109',
  },
  {
    id: 'vendor-10',
    name: 'AVI-SPL',
    category: 'AV/Broadcast',
    slaCompliance: 95.2,
    avgResponseTime: 3.1,
    contact: 'Emily Watson',
    phone: '(323) 555-0110',
  },
];

// === WORK ORDERS ===
export const workOrders: WorkOrder[] = [
  {
    id: 'WO-2026-0047',
    title: 'AC leaking in Sound Stage 3',
    description: 'Water pooling near HVAC Unit #RTU-04 base by camera rail A. Appears to be condensate drain issue.',
    propertyId: 'prop-1',
    spaceId: 'space-1-1',
    assetId: 'asset-1-1-1',
    status: 'open',
    priority: 'high',
    category: 'MEP',
    createdBy: 'user-1',
    createdAt: '2026-02-13T14:30:00Z',
    updatedAt: '2026-02-13T14:30:00Z',
  },
  {
    id: 'WO-2026-0046',
    title: 'Intermittent power fluctuation on Panel 7B',
    description: 'Edit Suite 2 monitors cycling off during live sessions. UPS-12 logs show voltage irregularities.',
    propertyId: 'prop-1',
    spaceId: 'space-1-2',
    assetId: 'asset-1-2-1',
    status: 'dispatched',
    priority: 'urgent',
    category: 'Electrical',
    assignedVendorId: 'vendor-3',
    createdBy: 'user-2',
    createdAt: '2026-02-13T09:15:00Z',
    updatedAt: '2026-02-13T11:20:00Z',
    cost: 850,
  },
  {
    id: 'WO-2026-0045',
    title: 'Badge reader not recognizing contractor credentials',
    description: 'Loading Dock C reader has failed to authenticate vendor badges since Tuesday AM. Main staff badges work.',
    propertyId: 'prop-1',
    spaceId: 'space-1-5',
    assetId: 'asset-1-5-1',
    status: 'in-progress',
    priority: 'medium',
    category: 'Security',
    assignedVendorId: 'vendor-8',
    assignedTechnicianId: 'user-3',
    createdBy: 'user-2',
    createdAt: '2026-02-12T15:40:00Z',
    updatedAt: '2026-02-13T08:30:00Z',
    cost: 320,
  },
  {
    id: 'WO-2026-0044',
    title: 'Server room CRAC unit alarming',
    description: 'CRAC Unit #1 high temp alarm. Room temp stable but unit reporting compressor fault.',
    propertyId: 'prop-1',
    spaceId: 'space-1-4',
    assetId: 'asset-1-4-1',
    status: 'completed',
    priority: 'high',
    category: 'MEP',
    assignedVendorId: 'vendor-1',
    createdBy: 'user-1',
    createdAt: '2026-02-11T22:10:00Z',
    updatedAt: '2026-02-12T16:30:00Z',
    completedAt: '2026-02-12T16:30:00Z',
    cost: 1240,
  },
  {
    id: 'WO-2026-0043',
    title: 'Control room broadcast router rebooting',
    description: 'Matrix router spontaneously reboots during live broadcast. Fiber connections appear secure.',
    propertyId: 'prop-1',
    spaceId: 'space-1-3',
    assetId: 'asset-1-3-1',
    status: 'dispatched',
    priority: 'urgent',
    category: 'AV/Broadcast',
    assignedVendorId: 'vendor-9',
    createdBy: 'user-2',
    createdAt: '2026-02-13T13:00:00Z',
    updatedAt: '2026-02-13T13:45:00Z',
  },
  {
    id: 'WO-2026-0042',
    title: 'LED wall panel artifacts',
    description: 'Sound Stage 3 LED wall showing intermittent pixel artifacts in upper-right quadrant.',
    propertyId: 'prop-1',
    spaceId: 'space-1-1',
    assetId: 'asset-1-1-3',
    status: 'open',
    priority: 'medium',
    category: 'AV/Broadcast',
    createdBy: 'user-2',
    createdAt: '2026-02-13T10:20:00Z',
    updatedAt: '2026-02-13T10:20:00Z',
  },
  {
    id: 'WO-2026-0041',
    title: 'Floor cleaning after event setup',
    description: 'Press Box Level 3 requires deep cleaning post-event. High-traffic areas need buffing.',
    propertyId: 'prop-2',
    spaceId: 'space-2-1',
    status: 'completed',
    priority: 'low',
    category: 'Janitorial',
    assignedVendorId: 'vendor-5',
    createdBy: 'user-2',
    createdAt: '2026-02-10T16:00:00Z',
    updatedAt: '2026-02-11T08:30:00Z',
    completedAt: '2026-02-11T08:30:00Z',
    cost: 180,
  },
  {
    id: 'WO-2026-0040',
    title: 'HVAC zone controller offline',
    description: 'Edit Suite 2 temperature control non-responsive. Zone shows offline in BMS.',
    propertyId: 'prop-1',
    spaceId: 'space-1-2',
    assetId: 'asset-1-2-2',
    status: 'completed',
    priority: 'medium',
    category: 'MEP',
    assignedVendorId: 'vendor-1',
    createdBy: 'user-1',
    createdAt: '2026-02-09T11:15:00Z',
    updatedAt: '2026-02-10T14:20:00Z',
    completedAt: '2026-02-10T14:20:00Z',
    cost: 680,
  },
  {
    id: 'WO-2026-0039',
    title: 'Overhead door motor grinding noise',
    description: 'Loading Dock C overhead door making grinding noise on open cycle. Needs inspection.',
    propertyId: 'prop-1',
    spaceId: 'space-1-5',
    assetId: 'asset-1-5-2',
    status: 'overdue',
    priority: 'medium',
    category: 'MEP',
    createdBy: 'user-2',
    createdAt: '2026-02-08T14:30:00Z',
    updatedAt: '2026-02-08T14:30:00Z',
  },
  {
    id: 'WO-2026-0038',
    title: 'Projector lamp replacement',
    description: 'Training Room 1 projector lamp at end of life. Brightness significantly reduced.',
    propertyId: 'prop-3',
    spaceId: 'space-3-1',
    assetId: 'asset-3-1-1',
    status: 'in-progress',
    priority: 'low',
    category: 'AV/Broadcast',
    assignedVendorId: 'vendor-10',
    assignedTechnicianId: 'user-3',
    createdBy: 'user-2',
    createdAt: '2026-02-12T09:00:00Z',
    updatedAt: '2026-02-13T07:15:00Z',
    cost: 420,
  },
  {
    id: 'WO-2026-0037',
    title: 'Fire suppression panel showing fault',
    description: 'Server Room B fire panel indicating zone 3 fault. System still operational.',
    propertyId: 'prop-1',
    spaceId: 'space-1-4',
    assetId: 'asset-1-4-2',
    status: 'dispatched',
    priority: 'high',
    category: 'Security',
    assignedVendorId: 'vendor-7',
    createdBy: 'user-1',
    createdAt: '2026-02-13T12:00:00Z',
    updatedAt: '2026-02-13T12:40:00Z',
  },
  {
    id: 'WO-2026-0036',
    title: 'Fiber panel testing post-install',
    description: 'Broadcast Booth A new fiber distribution panel requires validation testing.',
    propertyId: 'prop-2',
    spaceId: 'space-2-2',
    assetId: 'asset-2-2-1',
    status: 'completed',
    priority: 'medium',
    category: 'Electrical',
    assignedVendorId: 'vendor-3',
    createdBy: 'user-2',
    createdAt: '2026-02-11T08:00:00Z',
    updatedAt: '2026-02-12T10:15:00Z',
    completedAt: '2026-02-12T10:15:00Z',
    cost: 560,
  },
  {
    id: 'WO-2026-0035',
    title: 'Exhaust fan vibration',
    description: 'Maintenance Shop exhaust fan vibrating excessively during operation.',
    propertyId: 'prop-3',
    spaceId: 'space-3-2',
    assetId: 'asset-3-2-1',
    status: 'open',
    priority: 'medium',
    category: 'MEP',
    createdBy: 'user-2',
    createdAt: '2026-02-13T11:10:00Z',
    updatedAt: '2026-02-13T11:10:00Z',
  },
  {
    id: 'WO-2026-0034',
    title: 'Environmental monitor calibration',
    description: 'Control Room A environmental sensors reading 3 degrees high compared to reference.',
    propertyId: 'prop-1',
    spaceId: 'space-1-3',
    assetId: 'asset-1-3-2',
    status: 'in-progress',
    priority: 'low',
    category: 'MEP',
    assignedVendorId: 'vendor-2',
    assignedTechnicianId: 'user-3',
    createdBy: 'user-1',
    createdAt: '2026-02-12T13:30:00Z',
    updatedAt: '2026-02-13T09:00:00Z',
    cost: 280,
  },
  {
    id: 'WO-2026-0033',
    title: 'Routine janitorial service',
    description: 'Scheduled weekly cleaning for all Broadcast Production Center common areas.',
    propertyId: 'prop-1',
    spaceId: 'space-1-1',
    status: 'completed',
    priority: 'low',
    category: 'Janitorial',
    assignedVendorId: 'vendor-5',
    createdBy: 'user-2',
    createdAt: '2026-02-09T07:00:00Z',
    updatedAt: '2026-02-09T14:00:00Z',
    completedAt: '2026-02-09T14:00:00Z',
    cost: 340,
  },
  {
    id: 'WO-2026-0032',
    title: 'Camera rail lubrication',
    description: 'Sound Stage 3 Camera Rail A motion feels rough. Needs lubrication service.',
    propertyId: 'prop-1',
    spaceId: 'space-1-1',
    assetId: 'asset-1-1-2',
    status: 'completed',
    priority: 'low',
    category: 'AV/Broadcast',
    assignedVendorId: 'vendor-9',
    createdBy: 'user-2',
    createdAt: '2026-02-10T10:00:00Z',
    updatedAt: '2026-02-11T15:30:00Z',
    completedAt: '2026-02-11T15:30:00Z',
    cost: 220,
  },
  {
    id: 'WO-2026-0031',
    title: 'Security patrol route adjustment',
    description: 'Stadium Complex evening patrol needs to include Equipment Storage area.',
    propertyId: 'prop-2',
    spaceId: 'space-2-3',
    status: 'completed',
    priority: 'low',
    category: 'Security',
    assignedVendorId: 'vendor-7',
    createdBy: 'user-1',
    createdAt: '2026-02-08T16:00:00Z',
    updatedAt: '2026-02-09T08:00:00Z',
    completedAt: '2026-02-09T08:00:00Z',
    cost: 0,
  },
  {
    id: 'WO-2026-0030',
    title: 'UPS battery replacement',
    description: 'Edit Suite 2 UPS-12 battery bank at 78% capacity. Recommend proactive replacement.',
    propertyId: 'prop-1',
    spaceId: 'space-1-2',
    assetId: 'asset-1-2-1',
    status: 'open',
    priority: 'medium',
    category: 'Electrical',
    createdBy: 'user-1',
    createdAt: '2026-02-13T08:00:00Z',
    updatedAt: '2026-02-13T08:00:00Z',
  },
  {
    id: 'WO-2026-0029',
    title: 'HVAC filter replacement - quarterly PM',
    description: 'Quarterly preventive maintenance for all HVAC units across Broadcast Production Center.',
    propertyId: 'prop-1',
    spaceId: 'space-1-1',
    status: 'completed',
    priority: 'medium',
    category: 'MEP',
    assignedVendorId: 'vendor-1',
    createdBy: 'user-1',
    createdAt: '2026-02-07T08:00:00Z',
    updatedAt: '2026-02-08T17:00:00Z',
    completedAt: '2026-02-08T17:00:00Z',
    cost: 1580,
  },
  {
    id: 'WO-2026-0028',
    title: 'Access control system firmware update',
    description: 'All badge readers require security firmware update per vendor advisory.',
    propertyId: 'prop-1',
    spaceId: 'space-1-5',
    status: 'completed',
    priority: 'medium',
    category: 'Security',
    assignedVendorId: 'vendor-8',
    createdBy: 'user-1',
    createdAt: '2026-02-06T09:00:00Z',
    updatedAt: '2026-02-07T16:30:00Z',
    completedAt: '2026-02-07T16:30:00Z',
    cost: 920,
  },
];

// === ACTIVITY FEED ===
export const activityFeed: ActivityFeedItem[] = [
  {
    id: 'activity-1',
    workOrderId: 'WO-2026-0047',
    message: 'Created by Marcus Reyes',
    timestamp: '2026-02-13T14:30:00Z',
    userId: 'user-1',
  },
  {
    id: 'activity-2',
    workOrderId: 'WO-2026-0046',
    message: 'Dispatched to Rosendin Electric',
    timestamp: '2026-02-13T11:20:00Z',
    userId: 'user-2',
  },
  {
    id: 'activity-3',
    workOrderId: 'WO-2026-0045',
    message: 'Status updated to In Progress by Derek Morales',
    timestamp: '2026-02-13T08:30:00Z',
    userId: 'user-3',
  },
  {
    id: 'activity-4',
    workOrderId: 'WO-2026-0044',
    message: 'Completed by Johnson Controls',
    timestamp: '2026-02-12T16:30:00Z',
    userId: 'vendor-johnson',
  },
  {
    id: 'activity-5',
    workOrderId: 'WO-2026-0043',
    message: 'Dispatched to Diversified',
    timestamp: '2026-02-13T13:45:00Z',
    userId: 'user-2',
  },
  {
    id: 'activity-6',
    workOrderId: 'WO-2026-0042',
    message: 'Created by Sarah Chen',
    timestamp: '2026-02-13T10:20:00Z',
    userId: 'user-2',
  },
  {
    id: 'activity-7',
    workOrderId: 'WO-2026-0041',
    message: 'Completed by ABM Industries',
    timestamp: '2026-02-11T08:30:00Z',
    userId: 'user-2',
  },
  {
    id: 'activity-8',
    workOrderId: 'WO-2026-0040',
    message: 'Completed by Johnson Controls',
    timestamp: '2026-02-10T14:20:00Z',
    userId: 'vendor-johnson',
  },
  {
    id: 'activity-9',
    workOrderId: 'WO-2026-0038',
    message: 'Assigned to Derek Morales',
    timestamp: '2026-02-13T07:15:00Z',
    userId: 'user-2',
  },
  {
    id: 'activity-10',
    workOrderId: 'WO-2026-0037',
    message: 'Dispatched to Allied Universal',
    timestamp: '2026-02-13T12:40:00Z',
    userId: 'user-1',
  },
  {
    id: 'activity-11',
    workOrderId: 'WO-2026-0036',
    message: 'Completed by Rosendin Electric',
    timestamp: '2026-02-12T10:15:00Z',
    userId: 'user-2',
  },
  {
    id: 'activity-12',
    workOrderId: 'WO-2026-0035',
    message: 'Created by Sarah Chen',
    timestamp: '2026-02-13T11:10:00Z',
    userId: 'user-2',
  },
  {
    id: 'activity-13',
    workOrderId: 'WO-2026-0028',
    message: 'Completed by Convergint',
    timestamp: '2026-02-07T16:30:00Z',
    userId: 'user-1',
  },
];

// Default current user
export let currentUser = users[0]; // Marcus Reyes (Admin)
