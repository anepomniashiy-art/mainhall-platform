"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { COMPANY } from "@/lib/constants";

const navigation = [
  { label: "Проекты", href: "/projects/" },
  { label: "Подбор квартир", href: "/units/" },
  { label: "Застройщики", href: "/developers/" },
  { label: "Районы", href: "/districts/" },
  { label: "Аналитика", href: "/analytics/" },
  { label: "Рассрочки", href: "/installments/" },
  { label: "Команда", href: "/about/" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const path = usePathname() ?? "";
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      menuButton.current?.focus();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const matches = (href: string) => path === href.slice(0, -1) || path.startsWith(href);
  const links = navigation.map(({ href, label }) => (
    <Link
      href={href}
      key={href}
      aria-current={matches(href) ? (path.replace(/\/$/, "") === href.slice(0, -1) ? "page" : "location") : undefined}
      onClick={() => setOpen(false)}
    >
      {label}
    </Link>
  ));

  return (
    <header className="mh-header">
      <Link href="/" className="mh-wordmark" aria-label="Mainhall — главная" onClick={() => setOpen(false)}>
        Mainhall
      </Link>
      <nav aria-label="Основная навигация" className="mh-desktop-nav">
        {links}
      </nav>
      <a className="mh-header-contact" href={COMPANY.telegram} target="_blank" rel="noopener noreferrer">
        Связаться
      </a>
      <button
        ref={menuButton}
        type="button"
        className="mh-menu-toggle"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen(!open)}
      >
        {open ? "Закрыть" : "Меню"}
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      <nav id="mobile-nav" className="mh-mobile-nav" aria-label="Мобильная навигация" hidden={!open}>
        {links}
        <Link href="/contacts/" onClick={() => setOpen(false)}>Контакты</Link>
      </nav>
    </header>
  );
}
