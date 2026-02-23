export type Role =
  | 'Team-Admin'
  | 'Team-OpsCoordinator'
  | 'Team-Viewer'
  | 'Vendor-Admin'
  | 'Vendor-Tech';

export type Permission =
  | 'viewDashboard'
  | 'viewCostData'
  | 'createWorkOrders'
  | 'voiceIntake'
  | 'dispatchVendors'
  | 'updateWorkOrderStatus'
  | 'approveWorkOrders'
  | 'cancelWorkOrders'
  | 'viewAllWorkOrders'
  | 'manageVendors'
  | 'manageProperties'
  | 'manageAssets'
  | 'systemSettings';

export const rolePermissions: Record<Role, Permission[]> = {
  'Team-Admin': [
    'viewDashboard',
    'viewCostData',
    'createWorkOrders',
    'voiceIntake',
    'dispatchVendors',
    'updateWorkOrderStatus',
    'approveWorkOrders',
    'cancelWorkOrders',
    'viewAllWorkOrders',
    'manageVendors',
    'manageProperties',
    'manageAssets',
    'systemSettings',
  ],
  'Team-OpsCoordinator': [
    'viewDashboard',
    'createWorkOrders',
    'voiceIntake',
    'dispatchVendors',
    'updateWorkOrderStatus',
    'approveWorkOrders',
    'viewAllWorkOrders',
    'manageAssets',
  ],
  'Team-Viewer': ['viewDashboard', 'viewCostData', 'viewAllWorkOrders'],
  'Vendor-Admin': ['updateWorkOrderStatus'],
  'Vendor-Tech': ['updateWorkOrderStatus'],
};
