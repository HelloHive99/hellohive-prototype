import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SessionProvider } from '@/components/SessionProvider';
import { UserProvider } from '@/context/UserContext';
import { users } from '@/data/seed-data';
import type { User } from '@/data/seed-data';

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.userId;

  const resolvedUser: User =
    (userId ? users.find((u) => u.id === userId) : undefined) ?? users[0];

  return (
    <SessionProvider>
      <UserProvider initialUser={resolvedUser}>
        {children}
      </UserProvider>
    </SessionProvider>
  );
}
