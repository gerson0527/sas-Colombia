import { AppShell } from '@/components/app-shell';
import { PermissionsProvider } from '@/hooks/use-permissions';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionsProvider>
      <AppShell>{children}</AppShell>
    </PermissionsProvider>
  );
}
