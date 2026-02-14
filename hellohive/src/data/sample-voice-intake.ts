// Sample voice memo transcript for guaranteed demo path
export const SAMPLE_TRANSCRIPT =
  "AC is leaking in Stage 3 near the lighting rig. Water is pooling near the base of the unit by camera rail A.";

// AI-parsed fields matching the sample transcript
export const PARSED_FIELDS = {
  propertyId: 'prop-1', // Broadcast Production Center
  spaceId: 'space-1-1', // Sound Stage 3
  assetId: 'asset-1-1-1', // HVAC Unit #RTU-04
  priority: 'high' as const,
  category: 'MEP' as const,
  suggestedVendorId: 'vendor-1', // Johnson Controls
  title: 'AC leaking in Sound Stage 3',
};
