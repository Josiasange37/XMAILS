import { Sidebar } from "@/components/sidebar";
import { ToastProvider } from "@/components/ui/toast";
import { ErrorBoundary } from "@/components/error-boundary";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
            <div className="p-4 sm:p-6 lg:p-8">{children}</div>
          </main>
        </div>
      </ErrorBoundary>
    </ToastProvider>
  );
}
