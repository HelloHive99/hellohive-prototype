import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SessionProvider } from '@/components/SessionProvider';
import { UserProvider } from '@/context/UserContext';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { users } from '@/data/seed-data';
import type { User } from '@/data/seed-data';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.userId;

  const resolvedUser: User =
    (userId ? users.find((u) => u.id === userId) : undefined) ?? users[0];

  return (
    <SessionProvider>
      <UserProvider initialUser={resolvedUser}>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Header />
            <main className="flex-1 bg-neutral-950 p-8">{children}</main>
          </div>
        </div>
      </UserProvider>
    </SessionProvider>
  );
}
