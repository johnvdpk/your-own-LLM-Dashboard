import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ChatLayout } from '@/components/Chat/ChatLayout/ChatLayout';

export default async function Home() {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session || !session.user) {
    redirect('/login');
  }

  return (
    <main>
      <ChatLayout userName={session.user.name || session.user.email || 'User'} />
    </main>
  );
}
