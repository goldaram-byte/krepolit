"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

// The admin panel has its own nav (src/app/admin/(protected)/AdminNav.tsx)
// and shouldn't be wrapped in the public marketing header/footer — there is
// only one root layout (src/app/layout.tsx), so this switches chrome by
// pathname instead of restructuring the app directory into parallel roots.
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
