import AppSidebar, { MobileHeader } from "@/components/AppSidebar";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AppSidebar />
      <MobileHeader />
      <main className="flex-1 p-4 md:ml-56 md:p-6">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
