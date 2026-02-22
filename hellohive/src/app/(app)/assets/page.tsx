'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { properties, type Asset, type AssetHealthScore, type AssetCriticality, type OperationalImpact } from '@/data/seed-data';
import { useUser } from '@/context/UserContext';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { AlertTriangle, Clock, Wrench, TrendingUp, Plus, Edit, CheckSquare } from 'lucide-react';
import { AssetDrawer } from '@/components/assets/AssetDrawer';
import { BulkActionsBar } from '@/components/assets/BulkActionsBar';
import { BulkEditModal } from '@/components/assets/BulkEditModal';
import { RetireAssetConfirmDialog } from '@/components/assets/RetireAssetConfirmDialog';
import { DeleteAssetConfirmDialog } from '@/components/assets/DeleteAssetConfirmDialog';
import { AssetActionsDropdown } from '@/components/assets/AssetActionsDropdown';

type FilterType = 'all' | string;

export default function AssetsPage() {
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<'all' | AssetHealthScore>('all');
  const [criticalityFilter, setCriticalityFilter] = useState<'all' | AssetCriticality>('all');
  const [impactFilter, setImpactFilter] = useState<'all' | OperationalImpact>('all');
  const [pmStatusFilter, setPmStatusFilter] = useState<'all' | 'overdue' | 'upcoming'>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  const [isAssetDrawerOpen, setIsAssetDrawerOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>(undefined);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [isBulkRetireModalOpen, setIsBulkRetireModalOpen] = useState(false);
  const [retireAssetId, setRetireAssetId] = useState<string | null>(null);
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null);

  const { getAllWorkOrders, hasPermission, getAllAssets, retireAsset, deleteAsset, bulkRetireAssets, currentUser } = useUser();
  const workOrders = getAllWorkOrders();

  const canCreateAssets = hasPermission('manageAssets');
  const canEditAssets = hasPermission('manageAssets');
  const canRetire = hasPermission('manageAssets') && currentUser.role !== 'Vendor-Tech';
  const canDelete = hasPermission('manageAssets') && currentUser.role === 'Team-Admin';

  // Helper: Parse city and state from address "Street, City, State Zip"
  const parseCityState = (address: string) => {
    const parts = address.split(',');
    if (parts.length >= 2) {
      const city = parts[1].trim();
      const stateZip = parts[2]?.trim() || '';
      const state = stateZip.split(' ')[0] || '';
      return { city, state };
    }
    return { city: '', state: '' };
  };

  // Flatten all assets from all properties with full Asset type
  const allAssets = useMemo(() => {
    const assets: Array<Asset & {
      spaceName: string;
      propertyName: string;
      propertyId: string;
      city: string;
      state: string;
    }> = [];

    properties.forEach((property) => {
      const { city, state } = parseCityState(property.address);
      property.spaces.forEach((space) => {
        space.assets.forEach((asset) => {
          assets.push({
            ...asset,
            spaceName: space.name,
            propertyName: property.name,
            propertyId: property.id,
            city,
            state,
          });
        });
      });
    });

    return assets;
  }, []);

  // Calculate open work order counts per asset
  const openWorkOrdersCount = useMemo(() => {
    const counts: Record<string, number> = {};
    workOrders.forEach(wo => {
      if (wo.assetId && wo.status !== 'completed') {
        counts[wo.assetId] = (counts[wo.assetId] || 0) + 1;
      }
    });
    return counts;
  }, [workOrders]);

  // Helper: Check if PM is overdue
  const isPmOverdue = (nextPmDate?: string) => {
    if (!nextPmDate) return false;
    return new Date(nextPmDate) < new Date();
  };

  // Get unique asset types
  const assetTypes = useMemo(() => {
    const types = new Set(allAssets.map((a) => a.type));
    return Array.from(types).sort();
  }, [allAssets]);

  // Get unique cities and states
  const cities = useMemo(() => {
    const citySet = new Set(allAssets.map((a) => a.city).filter(Boolean));
    return Array.from(citySet).sort();
  }, [allAssets]);

  const states = useMemo(() => {
    const stateSet = new Set(allAssets.map((a) => a.state).filter(Boolean));
    return Array.from(stateSet).sort();
  }, [allAssets]);

  // Apply filters
  const filteredAssets = useMemo(() => {
    return allAssets.filter((asset) => {
      // Type filter
      if (typeFilter !== 'all' && asset.type !== typeFilter) return false;

      // Property filter
      if (propertyFilter !== 'all' && asset.propertyId !== propertyFilter) return false;

      // Health filter
      if (healthFilter !== 'all' && asset.health !== healthFilter) return false;

      // Criticality filter
      if (criticalityFilter !== 'all' && asset.criticality !== criticalityFilter) return false;

      // Impact filter
      if (impactFilter !== 'all' && asset.operationalImpact !== impactFilter) return false;

      // PM Status filter
      if (pmStatusFilter === 'overdue' && !isPmOverdue(asset.nextPmDate)) return false;
      if (pmStatusFilter === 'upcoming' && (isPmOverdue(asset.nextPmDate) || !asset.nextPmDate)) return false;

      // City filter
      if (cityFilter !== 'all' && asset.city !== cityFilter) return false;

      // State filter
      if (stateFilter !== 'all' && asset.state !== stateFilter) return false;

      // Quick filters from metric cards
      if (quickFilter === 'critical-health' && asset.health !== 'critical') return false;
      if (quickFilter === 'warning-health' && asset.health !== 'warning') return false;
      if (quickFilter === 'pm-overdue' && !isPmOverdue(asset.nextPmDate)) return false;
      if (quickFilter === 'with-open-wos' && (openWorkOrdersCount[asset.id] || 0) === 0) return false;
      if (quickFilter === 'high-impact' && asset.operationalImpact !== 'high') return false;
      if (quickFilter === 'critical-systems' && asset.criticality !== 'critical') return false;

      return true;
    });
  }, [allAssets, typeFilter, propertyFilter, healthFilter, criticalityFilter, impactFilter, pmStatusFilter, cityFilter, stateFilter, quickFilter, openWorkOrdersCount]);

  // Calculate metrics
  const metrics = useMemo(() => ({
    total: filteredAssets.length,
    criticalHealth: filteredAssets.filter(a => a.health === 'critical').length,
    warningHealth: filteredAssets.filter(a => a.health === 'warning').length,
    pmOverdue: filteredAssets.filter(a => isPmOverdue(a.nextPmDate)).length,
    withOpenWOs: filteredAssets.filter(a => (openWorkOrdersCount[a.id] || 0) > 0).length,
    highImpact: filteredAssets.filter(a => a.operationalImpact === 'high').length,
    criticalSystems: filteredAssets.filter(a => a.criticality === 'critical').length,
  }), [filteredAssets, openWorkOrdersCount]);

  // Badge variant mappings
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

  // Row highlighting logic
  const getRowClassName = (asset: Asset & { spaceName: string; propertyName: string; propertyId: string }) => {
    const baseClasses = "border-b border-gray-700/20 last:border-0 transition-colors";

    // Critical health = red background
    if (asset.health === 'critical') {
      return cn(baseClasses, 'bg-red-950/20 hover:bg-red-950/30 border-red-900/40');
    }

    // Warning health + critical system = amber background
    if (asset.health === 'warning' && asset.criticality === 'critical') {
      return cn(baseClasses, 'bg-amber-950/10 hover:bg-amber-950/20 border-amber-900/30');
    }

    // PM overdue = yellow background
    if (isPmOverdue(asset.nextPmDate)) {
      return cn(baseClasses, 'bg-yellow-950/10 hover:bg-yellow-950/20 border-yellow-900/30');
    }

    // Default
    return cn(baseClasses, 'hover:bg-neutral-900');
  };

  // Check if any filter is active
  const hasActiveFilters = typeFilter !== 'all' || propertyFilter !== 'all' || healthFilter !== 'all' ||
    criticalityFilter !== 'all' || impactFilter !== 'all' || pmStatusFilter !== 'all' ||
    cityFilter !== 'all' || stateFilter !== 'all' || quickFilter !== null;

  // Clear all filters
  const clearAllFilters = () => {
    setTypeFilter('all');
    setPropertyFilter('all');
    setHealthFilter('all');
    setCriticalityFilter('all');
    setImpactFilter('all');
    setPmStatusFilter('all');
    setCityFilter('all');
    setStateFilter('all');
    setQuickFilter(null);
  };

  // Selection handlers
  const toggleAssetSelection = (assetId: string) => {
    const newSet = new Set(selectedAssetIds);
    if (newSet.has(assetId)) {
      newSet.delete(assetId);
    } else {
      newSet.add(assetId);
    }
    setSelectedAssetIds(newSet);
  };

  const selectAllFiltered = () => {
    setSelectedAssetIds(new Set(filteredAssets.map(a => a.id)));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Assets
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {metrics.total} asset{metrics.total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {canEditAssets && (
            <Button
              variant={isSelectMode ? 'secondary' : 'ghost'}
              onClick={() => {
                setIsSelectMode(!isSelectMode);
                setSelectedAssetIds(new Set());
              }}
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              {isSelectMode ? 'Cancel Selection' : 'Select Multiple'}
            </Button>
          )}
          {canCreateAssets && (
            <Button onClick={() => {
              setEditingAsset(undefined);
              setIsAssetDrawerOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Asset
            </Button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Critical Health */}
        <button
          onClick={() => setQuickFilter(quickFilter === 'critical-health' ? null : 'critical-health')}
          className={cn(
            "text-left p-4 rounded-lg border transition-all",
            quickFilter === 'critical-health'
              ? 'bg-gray-800 border-[#EF4444] ring-2 ring-inset ring-[#EF4444]/20'
              : 'bg-gray-800 border-gray-700 hover:border-[#EF4444]/60'
          )}
        >
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Critical Health</p>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-3xl font-semibold tracking-tighter tabular-nums text-[#EF4444]">
              {metrics.criticalHealth}
            </p>
            <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
          </div>
        </button>

        {/* Warning Health */}
        <button
          onClick={() => setQuickFilter(quickFilter === 'warning-health' ? null : 'warning-health')}
          className={cn(
            "text-left p-4 rounded-lg border transition-all",
            quickFilter === 'warning-health'
              ? 'bg-gray-800 border-[#F59E0B] ring-2 ring-inset ring-[#F59E0B]/20'
              : 'bg-gray-800 border-gray-700 hover:border-[#F59E0B]/60'
          )}
        >
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Warning Health</p>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-3xl font-semibold tracking-tighter tabular-nums text-[#F59E0B]">
              {metrics.warningHealth}
            </p>
            <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
          </div>
        </button>

        {/* PM Overdue */}
        <button
          onClick={() => setQuickFilter(quickFilter === 'pm-overdue' ? null : 'pm-overdue')}
          className={cn(
            "text-left p-4 rounded-lg border transition-all",
            quickFilter === 'pm-overdue'
              ? 'bg-gray-800 border-[#F5C518] ring-2 ring-inset ring-[#F5C518]/20'
              : 'bg-gray-800 border-gray-700 hover:border-[#F5C518]/60'
          )}
        >
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">PM Overdue</p>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-3xl font-semibold tracking-tighter tabular-nums text-[#F5C518]">
              {metrics.pmOverdue}
            </p>
            <Clock className="w-5 h-5 text-[#F5C518]" />
          </div>
        </button>

        {/* With Open WOs */}
        <button
          onClick={() => setQuickFilter(quickFilter === 'with-open-wos' ? null : 'with-open-wos')}
          className={cn(
            "text-left p-4 rounded-lg border transition-all",
            quickFilter === 'with-open-wos'
              ? 'bg-gray-800 border-[#3B82F6] ring-2 ring-inset ring-[#3B82F6]/20'
              : 'bg-gray-800 border-gray-700 hover:border-[#3B82F6]/60'
          )}
        >
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">With Open WOs</p>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-3xl font-semibold tracking-tighter tabular-nums text-[#3B82F6]">
              {metrics.withOpenWOs}
            </p>
            <Wrench className="w-5 h-5 text-[#3B82F6]" />
          </div>
        </button>

        {/* High Impact */}
        <button
          onClick={() => setQuickFilter(quickFilter === 'high-impact' ? null : 'high-impact')}
          className={cn(
            "text-left p-4 rounded-lg border transition-all",
            quickFilter === 'high-impact'
              ? 'bg-gray-800 border-[#EF4444] ring-2 ring-inset ring-[#EF4444]/20'
              : 'bg-gray-800 border-gray-700 hover:border-[#EF4444]/60'
          )}
        >
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">High Impact</p>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-3xl font-semibold tracking-tighter tabular-nums text-[#EF4444]">
              {metrics.highImpact}
            </p>
            <TrendingUp className="w-5 h-5 text-[#EF4444]" />
          </div>
        </button>

        {/* Critical Systems */}
        <button
          onClick={() => setQuickFilter(quickFilter === 'critical-systems' ? null : 'critical-systems')}
          className={cn(
            "text-left p-4 rounded-lg border transition-all",
            quickFilter === 'critical-systems'
              ? 'bg-gray-800 border-[#EF4444] ring-2 ring-inset ring-[#EF4444]/20'
              : 'bg-gray-800 border-gray-700 hover:border-[#EF4444]/60'
          )}
        >
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Critical Systems</p>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-3xl font-semibold tracking-tighter tabular-nums text-[#EF4444]">
              {metrics.criticalSystems}
            </p>
            <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
          </div>
        </button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4 items-end">
          {/* Asset Type */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
              Asset Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
            >
              <option value="all">All</option>
              {assetTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Property */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
              Property
            </label>
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
            >
              <option value="all">All</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>

          {/* Health */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
              Health
            </label>
            <select
              value={healthFilter}
              onChange={(e) => setHealthFilter(e.target.value as 'all' | AssetHealthScore)}
              className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="good">Good</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Criticality */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
              Criticality
            </label>
            <select
              value={criticalityFilter}
              onChange={(e) => setCriticalityFilter(e.target.value as 'all' | AssetCriticality)}
              className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="important">Important</option>
              <option value="non-critical">Non-Critical</option>
            </select>
          </div>

          {/* Impact */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
              Impact
            </label>
            <select
              value={impactFilter}
              onChange={(e) => setImpactFilter(e.target.value as 'all' | OperationalImpact)}
              className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* PM Status */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
              PM Status
            </label>
            <select
              value={pmStatusFilter}
              onChange={(e) => setPmStatusFilter(e.target.value as 'all' | 'overdue' | 'upcoming')}
              className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="overdue">Overdue</option>
              <option value="upcoming">Upcoming</option>
            </select>
          </div>

          {/* City */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
              City
            </label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
            >
              <option value="all">All</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* State */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
              State
            </label>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
            >
              <option value="all">All</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          {/* Clear All Button */}
          {hasActiveFilters && (
            <div className="flex-shrink-0">
              <Button variant="ghost" onClick={clearAllFilters} className="whitespace-nowrap">
                Clear All
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Assets Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700/20">
                {isSelectMode && (
                  <th className="text-left pb-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={selectedAssetIds.size === filteredAssets.length && filteredAssets.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          selectAllFiltered();
                        } else {
                          setSelectedAssetIds(new Set());
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-700 bg-neutral-900 text-[#F5C518] focus:ring-2 focus:ring-[#F5C518] focus:ring-offset-0"
                    />
                  </th>
                )}
                <th className="text-left pb-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Asset Name
                </th>
                <th className="text-left pb-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left pb-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Health
                </th>
                <th className="text-left pb-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Open WOs
                </th>
                <th className="text-left pb-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  PM Status
                </th>
                <th className="text-left pb-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Criticality
                </th>
                <th className="text-left pb-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Impact
                </th>
                <th className="text-left pb-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Owner
                </th>
                <th className="text-left pb-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="text-left pb-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  City
                </th>
                <th className="text-left pb-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  State
                </th>
                {canEditAssets && (
                  <th className="text-left pb-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-20">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={isSelectMode ? (canEditAssets ? 13 : 12) : (canEditAssets ? 12 : 11)} className="pt-4 text-sm text-gray-400 text-center">
                    No assets found.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  const openWOs = openWorkOrdersCount[asset.id] || 0;
                  const pmOverdue = isPmOverdue(asset.nextPmDate);

                  return (
                    <tr
                      key={asset.id}
                      className={getRowClassName(asset)}
                    >
                      {/* Checkbox */}
                      {isSelectMode && (
                        <td className="py-4">
                          <input
                            type="checkbox"
                            checked={selectedAssetIds.has(asset.id)}
                            onChange={() => toggleAssetSelection(asset.id)}
                            className="w-4 h-4 rounded border-gray-700 bg-neutral-900 text-[#F5C518] focus:ring-2 focus:ring-[#F5C518] focus:ring-offset-0"
                          />
                        </td>
                      )}

                      {/* Asset Name */}
                      <td className="py-4">
                        <Link
                          href={`/assets/${asset.id}`}
                          className="text-sm font-medium text-[#F5C518] hover:text-[#F5C518]/80 transition-colors"
                        >
                          {asset.name}
                        </Link>
                        {asset.model && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {asset.model}
                          </p>
                        )}
                      </td>

                      {/* Type */}
                      <td className="py-4">
                        <Badge variant="pending" className="text-xs">
                          {asset.type}
                        </Badge>
                      </td>

                      {/* Health */}
                      <td className="py-4">
                        <Badge variant={healthBadgeVariant(asset.health)} className="text-xs">
                          {asset.health}
                        </Badge>
                      </td>

                      {/* Open WOs */}
                      <td className="py-4">
                        <span
                          className={cn(
                            "text-sm font-medium tabular-nums",
                            openWOs > 0 ? "text-[#F5C518]" : "text-gray-400"
                          )}
                        >
                          {openWOs}
                        </span>
                      </td>

                      {/* PM Status */}
                      <td className="py-4">
                        {pmOverdue ? (
                          <Badge variant="overdue" className="text-xs">PM Overdue</Badge>
                        ) : asset.nextPmDate ? (
                          <p className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(asset.nextPmDate), { addSuffix: true })}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">—</p>
                        )}
                      </td>

                      {/* Criticality */}
                      <td className="py-4">
                        <Badge variant={criticalityBadgeVariant(asset.criticality)} className="text-xs capitalize">
                          {asset.criticality}
                        </Badge>
                      </td>

                      {/* Impact */}
                      <td className="py-4">
                        <Badge variant={impactBadgeVariant(asset.operationalImpact)} className="text-xs capitalize">
                          {asset.operationalImpact}
                        </Badge>
                      </td>

                      {/* Owner */}
                      <td className="py-4">
                        <p className="text-sm text-white">
                          {asset.owner}
                        </p>
                      </td>

                      {/* Location */}
                      <td className="py-4">
                        <div className="text-sm">
                          <p className="text-white font-medium">
                            {asset.propertyName}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {asset.spaceName}
                          </p>
                        </div>
                      </td>

                      {/* City */}
                      <td className="py-4">
                        <p className="text-sm text-white">
                          {asset.city}
                        </p>
                      </td>

                      {/* State */}
                      <td className="py-4">
                        <p className="text-sm text-white">
                          {asset.state}
                        </p>
                      </td>

                      {/* Actions */}
                      {canEditAssets && (
                        <td className="px-6 py-4 text-sm text-right">
                          <AssetActionsDropdown
                            asset={asset}
                            onEdit={() => {
                              setEditingAsset(asset);
                              setIsAssetDrawerOpen(true);
                            }}
                            onRetire={() => {
                              setRetireAssetId(asset.id);
                            }}
                            onDelete={() => {
                              setDeleteAssetId(asset.id);
                            }}
                            canEdit={canEditAssets}
                            canRetire={canRetire}
                            canDelete={canDelete}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Asset Drawer */}
      <AssetDrawer
        isOpen={isAssetDrawerOpen}
        onClose={() => {
          setIsAssetDrawerOpen(false);
          setEditingAsset(undefined);
        }}
        asset={editingAsset}
      />

      {/* Bulk Actions Bar */}
      {selectedAssetIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedAssetIds.size}
          onBulkEdit={() => setIsBulkEditModalOpen(true)}
          onBulkRetire={() => setIsBulkRetireModalOpen(true)}
          onClearSelection={() => setSelectedAssetIds(new Set())}
        />
      )}

      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        selectedAssetIds={Array.from(selectedAssetIds)}
      />

      {/* Single asset retire */}
      {retireAssetId && (
        <RetireAssetConfirmDialog
          isOpen={!!retireAssetId}
          onClose={() => setRetireAssetId(null)}
          asset={getAllAssets().find(a => a.id === retireAssetId)!}
          onConfirm={(reason) => {
            retireAsset(retireAssetId, reason);
            setRetireAssetId(null);
          }}
        />
      )}

      {/* Bulk retire */}
      <RetireAssetConfirmDialog
        isOpen={isBulkRetireModalOpen}
        selectedCount={selectedAssetIds.size}
        onClose={() => setIsBulkRetireModalOpen(false)}
        onConfirm={(reason) => {
          bulkRetireAssets(Array.from(selectedAssetIds), reason);
          setSelectedAssetIds(new Set());
          setIsBulkRetireModalOpen(false);
        }}
      />

      {/* Single asset delete */}
      {deleteAssetId && (
        <DeleteAssetConfirmDialog
          isOpen={!!deleteAssetId}
          onClose={() => setDeleteAssetId(null)}
          asset={getAllAssets().find(a => a.id === deleteAssetId) ?? null}
          onConfirm={() => {
            deleteAsset(deleteAssetId);
            setDeleteAssetId(null);
          }}
        />
      )}
    </div>
  );
}
