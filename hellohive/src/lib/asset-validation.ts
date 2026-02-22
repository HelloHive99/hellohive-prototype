import type { Asset } from '@/data/seed-data';

/**
 * Validates basic information step fields
 */
export function validateBasicInfo(data: Partial<Asset>): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.name?.trim()) {
    errors.name = 'Asset name is required';
  }

  if (!data.type) {
    errors.type = 'Asset type is required';
  }

  if (data.serialNumber && !/^[A-Z0-9-]+$/i.test(data.serialNumber)) {
    errors.serialNumber = 'Invalid serial number format (alphanumeric and dashes only)';
  }

  return errors;
}

/**
 * Validates location and classification step fields
 */
export function validateLocation(data: Partial<Asset>): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.health) {
    errors.health = 'Health status is required';
  }

  if (!data.criticality) {
    errors.criticality = 'Criticality is required';
  }

  if (!data.operationalImpact) {
    errors.operationalImpact = 'Operational impact is required';
  }

  return errors;
}

/**
 * Validates maintenance schedule step fields
 */
export function validateMaintenance(data: Partial<Asset>): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.pmFrequencyDays || data.pmFrequencyDays <= 0) {
    errors.pmFrequencyDays = 'PM frequency must be greater than 0';
  }

  if (data.warrantyExpiration && data.installationDate) {
    if (new Date(data.warrantyExpiration) <= new Date(data.installationDate)) {
      errors.warrantyExpiration = 'Warranty expiration must be after installation date';
    }
  }

  return errors;
}

/**
 * Validates ownership and accountability step fields
 */
export function validateOwnership(data: Partial<Asset>): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.owner?.trim()) {
    errors.owner = 'Asset owner is required';
  }

  return errors;
}

/**
 * Checks if a serial number already exists in the asset list
 */
export function checkSerialNumberDuplicate(
  serialNumber: string,
  assets: Asset[],
  excludeId?: string
): Asset | null {
  if (!serialNumber) return null;

  return assets.find(a =>
    a.id !== excludeId &&
    a.serialNumber?.toLowerCase() === serialNumber.toLowerCase()
  ) || null;
}

/**
 * Detects similar assets in the same space (fuzzy matching)
 */
export function detectSimilarAssets(
  name: string,
  type: string,
  spaceId: string,
  assets: Asset[]
): Asset[] {
  const nameLower = name.toLowerCase();

  return assets.filter(a =>
    a.spaceId === spaceId &&
    a.type === type &&
    a.name.toLowerCase().includes(nameLower.substring(0, Math.max(1, nameLower.length - 2)))
  );
}

/**
 * Validates an entire asset object (all steps combined)
 */
export function validateFullAsset(asset: Partial<Asset>, spaceId: string): Record<string, string> {
  return {
    ...validateBasicInfo(asset),
    ...validateLocation(asset),
    ...validateMaintenance(asset),
    ...validateOwnership(asset),
  };
}
