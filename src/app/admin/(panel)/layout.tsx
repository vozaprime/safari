import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getVerifiedSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Toaster from "@/components/admin/Toaster";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getVerifiedSession();
  if (!session) redirect("/admin/login");

  const newCount = await prisma.contactMessage.count({ where: { status: "new", archivedAt: null } });

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AdminSidebar email={session.email} role={session.role} newCount={newCount} />
      <main className="min-w-0 flex-1 bg-ivory px-5 py-6 md:px-8 md:py-8">{children}</main>
      <Suspense fallback={null}>
        <Toaster />
      </Suspense>
    </div>
  );
}
