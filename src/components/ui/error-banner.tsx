"use client";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorBannerProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorBanner({ message = "Something went wrong", onRetry, className }: ErrorBannerProps) {
  return (
    <div className={cn("flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50", className)}>
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
        <p className="text-sm text-red-700 dark:text-red-400">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="shrink-0">
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}
