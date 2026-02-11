"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, BarChart3, Home, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/map", label: "Map", icon: Map },
  { href: "/stats", label: "Statistics", icon: BarChart3 },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#1B2A4A] text-white shadow-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-auto items-center justify-center rounded-md bg-[#C4A35A] px-2.5 py-1 text-[#1B2A4A] font-extrabold text-sm tracking-wide shadow-sm">
            H1B
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-base font-semibold leading-tight text-white">
              H1B Wages Explorer
            </span>
            <span className="text-[10px] text-[#C4A35A] font-medium tracking-wider uppercase">
              LCA Disclosure Data
            </span>
          </div>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-2 text-white/80 hover:text-white hover:bg-white/10 ${
                    isActive
                      ? "bg-white/15 text-white border border-[#C4A35A]/40"
                      : ""
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Mobile navigation */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64 bg-[#1B2A4A] border-[#2B3F6B]">
            <div className="flex items-center gap-2 mb-8 mt-4">
              <div className="flex h-8 w-auto items-center justify-center rounded-md bg-[#C4A35A] px-2 py-1 text-[#1B2A4A] font-extrabold text-xs">
                H1B
              </div>
              <span className="text-white font-semibold">Wages Explorer</span>
            </div>
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                  >
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-2 text-white/80 hover:text-white hover:bg-white/10 ${
                        isActive ? "bg-white/15 text-white" : ""
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
