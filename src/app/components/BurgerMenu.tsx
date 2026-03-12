"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  ChevronDown,
  Gamepad2,
  Info,
  MapPin,
  Menu,
  Settings,
  Wine,
  X,
} from "lucide-react";

const menuButtonClass =
  "flex h-9 w-9 items-center justify-center rounded-full border text-white";
const menuButtonStyle = {
  borderRadius: 80,
};

const menuItems = [
  {
    label: "Plan",
    href: "/plan",
    icon: MapPin,
  },
  {
    label: "Quizz",
    href: "/quiz",
    icon: Gamepad2,
  },
  {
    label: "Nos offres",
    href: "/offres",
    icon: Wine,
  },
  {
    label: "Mirokai Experience",
    href: "/mirokai-experience",
    icon: CalendarDays,
  },
  {
    label: "À propos",
    href: "/a-propos",
    icon: Info,
  },
  {
    label: "Admin",
    href: "/admin",
    icon: Settings,
  },
] as const;

export function BurgerMenu() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={open}
        aria-haspopup="true"
        className={`${menuButtonClass} ${
          open ? "z-50 border-black bg-white text-zinc-900" : "border-white/60"
        }`}
        style={menuButtonStyle}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {open && (
        <>
          <div role="presentation" className="fixed inset-0 z-40 bg-black/40" aria-hidden="true" onClick={close} />
          <div role="dialog" aria-label="Menu de navigation" className="fixed inset-0 z-40 flex flex-col bg-white px-6 pb-10 pt-8 text-zinc-950">
            <div className="flex items-center">
              <Image src="/Logo Enchanted Tools.png" alt="Logo Enchanted Tools" width={150} height={40} priority />
            </div>

            <nav className="mt-10 flex flex-col gap-1">
              {menuItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    className="flex items-center justify-between rounded-xl px-4 py-4 text-base font-medium text-zinc-900 transition-colors hover:bg-zinc-50"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-zinc-700" aria-hidden />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-zinc-500" aria-hidden />
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
