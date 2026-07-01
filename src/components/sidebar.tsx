"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import {
  BarChart3,
  Inbox,
  Send,
  Clock,
  Users,
  Megaphone,
  Tag,
  FileText,
  Zap,
  Wrench,
  Settings,
  Mail,
  Moon,
  Sun,
  ChevronRight,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Inbox", href: "/dashboard/emails/inbox", icon: Inbox },
  { name: "Sent", href: "/dashboard/emails/sent", icon: Send },
  { name: "Scheduled", href: "/dashboard/emails/scheduled", icon: Clock },
  { name: "Contacts", href: "/dashboard/contacts", icon: Users },
  { name: "Broadcasts", href: "/dashboard/broadcasts", icon: Megaphone },
  { name: "Promotions", href: "/dashboard/promotions", icon: Tag },
  { name: "Templates", href: "/dashboard/templates", icon: FileText },
  { name: "Automations", href: "/dashboard/automations", icon: Zap },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Setup", href: "/dashboard/setup", icon: Wrench },
];

function TypingLabel({ name, typing }: { name: string; typing: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const val = useRef({ current: 0 });
  const anim = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (anim.current) anim.current.kill();
    anim.current = gsap.to(val.current, {
      current: typing ? name.length : 0,
      duration: typing ? Math.min(0.35, name.length * 0.04) : 0.12,
      ease: "none",
      onUpdate: () => {
        if (ref.current) ref.current.textContent = name.slice(0, Math.round(val.current.current));
      },
      onComplete: () => {
        if (!typing && ref.current) ref.current.textContent = "";
      },
    });
  }, [typing, name]);

  return (
    <span
      ref={ref}
      className="text-xs font-semibold text-foreground whitespace-nowrap"
    />
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  const close = () => {
    setOpen(false);
    setMobileOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const navLink = (item: (typeof navigation)[number], inPanel = false) => (
    <Link
      key={item.name}
      href={item.href}
      onClick={close}
      className={cn(
        "relative flex items-center gap-3 rounded-xl transition-all duration-200",
        inPanel
          ? "px-3 py-2.5 text-sm"
          : "justify-center w-10 h-10 mx-auto",
        isActive(item.href)
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <item.icon className={cn("flex-shrink-0", inPanel ? "h-[18px] w-[18px]" : "h-5 w-5")} />
      {inPanel && <span className="font-medium truncate">{item.name}</span>}
      {isActive(item.href) && !inPanel && (
        <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-primary" />
      )}
    </Link>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-xl bg-background/80 backdrop-blur-xl border border-border/50 text-foreground shadow-lg"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <Mail className="h-5 w-5 text-primary" /> : <BarChart3 className="h-5 w-5" />}
      </button>

      {/* Desktop trigger pill */}
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className={cn(
          "hidden lg:flex fixed left-3 top-1/2 -translate-y-1/2 z-40 items-center justify-center w-9 h-14 rounded-2xl transition-all duration-300 group",
          open
            ? "opacity-0 pointer-events-none scale-75"
            : "bg-background/70 backdrop-blur-xl border border-border/40 shadow-lg opacity-100 hover:bg-primary/10 hover:border-primary/30 hover:shadow-primary/5 cursor-pointer animate-pulse-subtle"
        )}
      >
        <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors group-hover:translate-x-0.5 transition-transform" />
        <span className="absolute left-full ml-2 px-2 py-1 rounded-lg bg-popover/90 backdrop-blur-xl border border-border/40 text-[11px] font-medium text-popover-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          Menu
        </span>
      </button>

      {/* Desktop floating bubble panel */}
      <div
        ref={sidebarRef}
        className={cn(
          "hidden lg:flex fixed left-3 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-1 py-4 px-2 bg-background/70 backdrop-blur-2xl border border-border/40 rounded-3xl shadow-2xl transition-all duration-300 origin-left",
          open ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
        )}
      >
        {/* Logo */}
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center mb-1 cursor-pointer" onClick={close}>
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div className="w-6 border-t border-border/30 my-1" />

        {/* Nav */}
        <nav className="flex flex-col items-center gap-0.5 py-1">
          {navigation.map((item) => (
            <div
              key={item.name}
              className="relative"
              onMouseEnter={() => setHoveredItem(item.name)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {navLink(item)}
              <div className={`absolute left-full ml-3 top-1/2 -translate-y-1/2 pointer-events-none z-50 transition-all duration-200 ${
                hoveredItem === item.name ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
              }`}>
                <div className="bg-popover/90 backdrop-blur-xl border border-border/40 rounded-lg px-3 py-1.5 shadow-lg flex items-center gap-2 whitespace-nowrap">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />
                  <TypingLabel name={item.name} typing={hoveredItem === item.name} />
                </div>
              </div>
            </div>
          ))}
        </nav>

        <div className="w-6 border-t border-border/30 my-1" />

        {/* Theme */}
        <button
          onClick={() => { toggleTheme(); }}
          className="flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={theme === "dark" ? "Light Mode" : "Dark Mode"}
        >
          {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>
        <Link
          href="/dashboard/settings"
          onClick={close}
          className="flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Settings"
        >
          <Settings className="h-[18px] w-[18px]" />
        </Link>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-72 bg-background/90 backdrop-blur-2xl border-r border-border/50 transform transition-all duration-300 ease-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col p-4">
          <div className="flex items-center gap-3 px-3 py-3 border-b border-border/50 mb-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="h-[18px] w-[18px] text-primary" />
            </div>
            <span className="font-bold text-base text-foreground">Xmailo</span>
          </div>
          <nav className="flex-1 overflow-y-auto space-y-0.5">
            {navigation.map((item) => navLink(item, true))}
          </nav>
          <div className="border-t border-border/50 pt-2 mt-2 space-y-0.5">
            <button
              onClick={() => { toggleTheme(); setMobileOpen(false); }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>
            <Link
              href="/dashboard/settings"
              onClick={close}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Settings className="h-[18px] w-[18px]" />
              <span>Settings</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile bottom tab */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-2xl border-t border-border/50 safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-1.5">
          {navigation.slice(0, 5).map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors relative",
                isActive(item.href) ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-none">{item.name}</span>
              {isActive(item.href) && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          ))}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-muted-foreground"
          >
            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex items-center justify-center">
              <span className="text-[10px] font-bold">...</span>
            </div>
            <span className="text-[10px] font-medium leading-none">More</span>
          </button>
        </div>
      </div>
    </>
  );
}
