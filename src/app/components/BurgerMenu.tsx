"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Menu, Map, Settings } from "lucide-react";

const menuButtonClass =
  "flex h-9 w-9 items-center justify-center rounded-full border text-white";
const menuButtonStyle = {
  borderRadius: 80,
  borderColor: "var(--Neutral-25, #FDFDFD)",
};

export function BurgerMenu() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        aria-label="Ouvrir le menu"
        aria-expanded={open}
        aria-haspopup="true"
        className={menuButtonClass}
        style={menuButtonStyle}
        onClick={() => setOpen(true)}
      >
        <Menu className="h-4 w-4" />
      </button>

      {open && (
        <>
          <div
            role="presentation"
            className="fixed inset-0 z-40 bg-black/50 transition-opacity"
            aria-hidden="true"
            onClick={close}
          />
          <div
            role="dialog"
            aria-label="Menu de navigation"
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xs flex-col gap-2 border-l border-white/20 bg-[#462B7E]/95 p-6 pt-16 shadow-xl backdrop-blur-md"
            style={{ borderRadius: "16px 0 0 16px" }}
          >
            <Link
              href="/plan"
              onClick={close}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-white transition-colors hover:bg-white/15"
              style={{
                background: "rgba(253, 253, 253, 0.15)",
                backdropFilter: "blur(10px)",
              }}
            >
              <Map className="h-5 w-5 shrink-0" aria-hidden />
              Plan
            </Link>
            <Link
              href="/admin"
              onClick={close}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-white transition-colors hover:bg-white/15"
              style={{
                background: "rgba(253, 253, 253, 0.15)",
                backdropFilter: "blur(10px)",
              }}
            >
              <Settings className="h-5 w-5 shrink-0" aria-hidden />
              Admin
            </Link>
          </div>
        </>
      )}
    </>
  );
}
