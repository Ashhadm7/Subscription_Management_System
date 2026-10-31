import { requireCustomer } from "@/lib/auth/guards";
import { AppShell } from "@/components/layout/app-shell";
import { getUnreadNotificationCount } from "@/lib/notifications";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCustomer();
  const notificationCount = await getUnreadNotificationCount(user.id);
  return (
    <AppShell
      role="CUSTOMER"
      user={{ name: user.name, email: user.email }}
      notificationCount={notificationCount}
    >
      {children}
    </AppShell>
  );
}
