'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { properties, users, type Asset, type AssetHealthScore, type AssetCriticality, type OperationalImpact } from '@/data/seed-data';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Edit, Archive, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { AssetDrawer } from '@/components/assets/AssetDrawer';
import { RetireAssetConfirmDialog } from '@/components/assets/RetireAssetConfirmDialog';
import { DeleteAssetConfirmDialog } from '@/components/assets/DeleteAssetConfirmDialog';
import { AssetOverviewSection } from '@/components/assets/AssetOverviewSection';
import { AssetRiskHealthPanel } from '@/components/assets/AssetRiskHealthPanel';
import { AssetWorkOrdersSection } from '@/components/assets/AssetWorkOrdersSection';
import { AssetPreventiveMaintenanceSection } from '@/components/assets/AssetPreventiveMaintenanceSection';
import { AssetCostReliabilitySection } from '@/components/assets/AssetCostReliabilitySection';
import { AssetOwnershipSection } from '@/components/assets/AssetOwnershipSection';
import { AssetPartsSection } from '@/components/assets/AssetPartsSection';
import { AssetTimelineSection } from '@/components/assets/AssetTimelineSection';

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, hasPermission, getAllWorkOrders, getTechnicianById, getVendorById, retireAsset, deleteAsset } = useUser();

  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isRetireDialogOpen, setIsRetireDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const assetId = params.id as string;

  // Find asset in nested structure (Property → Space → Asset)
  let asset: Asset | null = null;
  let property = null;
  let space = null;

  for (const prop of properties) {
    for (const sp of prop.spaces) {
      const foundAsset = sp.assets.find(a => a.id === assetId);
      if (foundAsset) {
        asset = foundAsset;
        property = prop;
        space = sp;
        break;
      }
    }
    if (asset) break;
  }

  // Not found handling
  if (!asset || !property || !space) {
    return (
      <div className="space-y-6">
        <Card>
          <p className="text-sm text-gray-400">Asset not found.</p>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assets
          </Button>
        </Card>
      </div>
    );
  }

  // Permission checks
  const canEdit = hasPermission('manageAssets');
  const canRetire = hasPermission('manageAssets') && currentUser.role !== 'Vendor-Tech';
  const canDelete = hasPermission('manageAssets') && currentUser.role === 'Team-Admin';

  // Fetch related data
  const workOrders = getAllWorkOrders().filter(wo => wo.assetId === assetId);
  const primaryTech = asset.primaryTechnicianId ? getTechnicianById(asset.primaryTechnicianId) : undefined;
  const preferredVendor = asset.preferredVendorId ? getVendorById(asset.preferredVendorId) : undefined;
  const escalationOwner = asset.escalationOwnerId ? users.find(u => u.id === asset.escalationOwnerId) : undefined;

  // Badge variant helpers (reuse from assets list page)
  const healthBadgeVariant = (health: AssetHealthScore) => {
    switch (health) {
      case 'good': return 'completed';
      case 'warning': return 'pending';
      case 'critical': return 'overdue';
    }
  };

  const criticalityBadgeVariant = (criticality: AssetCriticality) => {
    switch (criticality) {
      case 'critical': return 'overdue';
      case 'important': return 'in-progress';
      case 'non-critical': return 'open';
    }
  };

  const impactBadgeVariant = (impact: OperationalImpact) => {
    switch (impact) {
      case 'high': return 'overdue';
      case 'medium': return 'pending';
      case 'low': return 'completed';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-2 -ml-3"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assets
          </Button>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            {asset.name}
          </h1>
          {asset.isRetired && (
            <Badge variant="overdue" className="mt-2">
              Retired {asset.retiredAt && `on ${format(new Date(asset.retiredAt), 'MMM d, yyyy')}`}
            </Badge>
          )}
          <div className="flex items-center gap-2 mt-3">
            <Badge variant={healthBadgeVariant(asset.health)} className="capitalize">
              {asset.health}
            </Badge>
            <Badge variant={criticalityBadgeVariant(asset.criticality)} className="capitalize">
              {asset.criticality}
            </Badge>
            <Badge variant={impactBadgeVariant(asset.operationalImpact)} className="capitalize">
              {asset.operationalImpact} Impact
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {canEdit && !asset.isRetired && (
            <Button onClick={() => setIsEditDrawerOpen(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Asset
            </Button>
          )}

          {canRetire && !asset.isRetired && (
            <Button variant="secondary" onClick={() => setIsRetireDialogOpen(true)}>
              <Archive className="w-4 h-4 mr-2" />
              Retire Asset
            </Button>
          )}

          {canDelete && (
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* 8 Section Components */}
      <AssetOverviewSection asset={asset} property={property} space={space} />
      <AssetRiskHealthPanel asset={asset} />
      <AssetWorkOrdersSection asset={asset} workOrders={workOrders} />
      <AssetPreventiveMaintenanceSection asset={asset} />
      <AssetCostReliabilitySection asset={asset} />
      <AssetOwnershipSection
        asset={asset}
        primaryTech={primaryTech}
        preferredVendor={preferredVendor}
        escalationOwner={escalationOwner}
      />
      <AssetPartsSection asset={asset} property={property} space={space} />
      <AssetTimelineSection asset={asset} workOrders={workOrders} />

      {/* Dialogs and Drawers */}
      <AssetDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        asset={asset}
      />

      <RetireAssetConfirmDialog
        isOpen={isRetireDialogOpen}
        onClose={() => setIsRetireDialogOpen(false)}
        asset={asset}
        onConfirm={(reason) => {
          retireAsset(asset.id, reason);
          setIsRetireDialogOpen(false);
          router.push('/assets');
        }}
      />

      <DeleteAssetConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        asset={asset}
        onConfirm={() => {
          deleteAsset(asset.id);
          router.push('/assets');
        }}
      />
    </div>
  );
}
