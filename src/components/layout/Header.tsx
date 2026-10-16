"use client";

import Link from "next/link";
import { useState } from "react";
import { COMPANY } from "@/lib/constants";

const NAV_ITEMS = [
  { label: "Проекты", href: "/projects" },
  { label: "Девелоперы", href: "/developers" },
  { label: "Инвестиции", href: "/#approach" },
  { label: "Коммерческая", href: "/commercial" },
  { label: "Контакты", href: "/#contact" },
] as const;

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[var(--dark)]/95 backdrop-blur-md border-b border-[var(--gold)]/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="flex items-center gap-2 text-[var(--cream)] group-hover:text-[var(--gold-light)] transition-colors" aria-label="MAINHALL">
              <span className="font-sans text-2xl font-light tracking-[-0.09em]">M</span>
              <span aria-hidden="true" className="h-px w-10 bg-current" />
              <span className="font-sans text-2xl font-light tracking-[-0.09em]">H</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-[var(--cream)]/70 hover:text-[var(--gold)] transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <a
              href={`tel:${COMPANY.phone.replace(/[\s()-]/g, "")}`}
              className="text-sm font-medium text-[var(--gold)] hover:text-[var(--gold-light)] transition-colors"
            >
              {COMPANY.phone}
            </a>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-[var(--cream)]/70 hover:text-[var(--gold)]"
            aria-label="Меню"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <nav className="md:hidden border-t border-[var(--gold)]/10 py-4 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="block px-2 py-2 text-sm text-[var(--cream)]/70 hover:text-[var(--gold)] transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <a
              href={`tel:${COMPANY.phone.replace(/[\s()-]/g, "")}`}
              className="block px-2 py-2 text-sm text-[var(--gold)]"
            >
              {COMPANY.phone}
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}
