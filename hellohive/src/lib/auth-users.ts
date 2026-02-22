// Static credential store for demo authentication.
// All accounts share the password: HelloHive2025!
// Hash generated with bcryptjs cost factor 10.

export interface AuthUser {
  userId: string; // Matches User.id in seed-data.ts
  email: string;
  passwordHash: string;
}

const SHARED_HASH = '$2b$10$r8k8BnPJ48BxQRhi7rFYeOQUMk1S6CQcInI..gHcvZvBgA2noP1d.';

export const authUsers: AuthUser[] = [
  {
    userId: 'user-1',
    email: 'marcus@hellohive.io',
    passwordHash: SHARED_HASH,
  },
  {
    userId: 'user-2',
    email: 'sarah@hellohive.io',
    passwordHash: SHARED_HASH,
  },
  {
    userId: 'user-4',
    email: 'james@hellohive.io',
    passwordHash: SHARED_HASH,
  },
  {
    userId: 'user-3',
    email: 'derek@morales-hvac.com',
    passwordHash: SHARED_HASH,
  },
  {
    userId: 'vendor-johnson',
    email: 'dispatch@johnsoncontrols.com',
    passwordHash: SHARED_HASH,
  },
  {
    userId: 'tech-vendor1-1',
    email: 'm.torres@johnsoncontrols.com',
    passwordHash: SHARED_HASH,
  },
  {
    userId: 'tech-vendor1-2',
    email: 'a.martinez@johnsoncontrols.com',
    passwordHash: SHARED_HASH,
  },
];
