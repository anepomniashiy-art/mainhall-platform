import type { Metadata } from "next";
import Link from "next/link";
import { TARGET_DEVELOPERS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Девелоперы",
  description:
    "Ведущие девелоперы премиальной жилой недвижимости Москвы — Sminex, Vesper, Capital Group, MR Group и другие.",
};

export default function DevelopersPage() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl">
          <p className="text-[var(--gold)] text-sm font-medium tracking-[0.2em] uppercase mb-4">
            Девелоперы
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-[var(--dark)]">
            Ведущие застройщики премиального сегмента
          </h1>
          <p className="mt-4 text-[var(--text-2)] leading-relaxed">
            Мы работаем с крупнейшими девелоперами Москвы, реализующими проекты
            в сегменте premium и luxury. Каждый застройщик проходит нашу оценку
            по качеству строительства, репутации и инвестиционной привлекательности.
          </p>
        </div>

        {/* Developer grid */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TARGET_DEVELOPERS.map((dev) => (
            <DeveloperCard key={dev.name} name={dev.name} url={dev.url} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DeveloperCard({ name, url }: { name: string; url: string }) {
  const slug = name.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="group border border-[var(--cream-2)] hover:border-[var(--gold)]/40 bg-[var(--bg)] hover:bg-white transition-all p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-serif text-lg text-[var(--dark)] group-hover:text-[var(--gold-dark)] transition-colors">
            {name}
          </h2>
          <p className="mt-1 text-xs text-[var(--gray)]">
            Премиальный девелопер · Москва
          </p>
        </div>
        <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-[var(--cream)] text-[var(--gold-dark)] font-serif text-sm">
          {name.charAt(0)}
        </span>
      </div>

      <div className="mt-6 pt-4 border-t border-[var(--cream-2)] flex items-center justify-between">
        <span className="text-xs text-[var(--gray)]">
          Проекты скоро
        </span>
        <Link
          href={`/projects?developer=${slug}`}
          className="text-xs font-medium text-[var(--gold-dark)] hover:text-[var(--gold)] transition-colors"
        >
          Проекты →
        </Link>
      </div>
    </div>
  );
}
