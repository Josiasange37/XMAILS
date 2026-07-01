import { Sidebar } from "@/components/sidebar";
import { ToastProvider } from "@/components/ui/toast";
import { ErrorBoundary } from "@/components/error-boundary";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <div className="min-h-screen bg-background overflow-x-hidden">
          <Sidebar />
          <main className="lg:pl-20 pb-16 lg:pb-0 pt-12 lg:pt-0">
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </ErrorBoundary>
    </ToastProvider>
  );
}
