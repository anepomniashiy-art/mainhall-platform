import type { Metadata } from "next";
import Link from "next/link";
import { PRICE_THRESHOLD_PER_SQM } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Проекты",
  description:
    "Каталог премиальных жилых проектов Москвы от 800 000 ₽/м². Новостройки от ведущих девелоперов.",
};

/** Placeholder project data — will be replaced with DB queries */
const PLACEHOLDER_PROJECTS = [
  {
    slug: "lavrushinsky",
    name: "Лаврушинский",
    developer: "Sminex",
    district: "Якиманка",
    metro: "Третьяковская",
    priceFrom: 1_200_000,
    status: "В продаже",
    completionYear: "2025",
    projectClass: "Deluxe",
  },
  {
    slug: "badaevskiy",
    name: "Бадаевский",
    developer: "Capital Group",
    district: "Дорогомилово",
    metro: "Кутузовская",
    priceFrom: 1_500_000,
    status: "В продаже",
    completionYear: "2026",
    projectClass: "Deluxe",
  },
  {
    slug: "grand-tower",
    name: "Grand Tower",
    developer: "MR Group",
    district: "Пресненский",
    metro: "Деловой центр",
    priceFrom: 900_000,
    status: "В продаже",
    completionYear: "2025",
    projectClass: "Premium",
  },
  {
    slug: "cloud-nine",
    name: "Cloud Nine",
    developer: "Vesper",
    district: "Раменки",
    metro: "Университет",
    priceFrom: 850_000,
    status: "В продаже",
    completionYear: "2026",
    projectClass: "Premium",
  },
  {
    slug: "city-bay",
    name: "City Bay",
    developer: "MR Group",
    district: "Хорошёво-Мнёвники",
    metro: "Шелепиха",
    priceFrom: 800_000,
    status: "В продаже",
    completionYear: "2026",
    projectClass: "Business+",
  },
  {
    slug: "stone-towers",
    name: "STONE Towers",
    developer: "STONE",
    district: "Мневники",
    metro: "Мнёвники",
    priceFrom: 820_000,
    status: "В продаже",
    completionYear: "2025",
    projectClass: "Premium",
  },
];

function fmt(n: number) {
  return new Intl.NumberFormat("ru-RU").format(n);
}

export default function ProjectsPage() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[var(--gold)] text-sm font-medium tracking-[0.2em] uppercase mb-4">
              Проекты
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl text-[var(--dark)]">
              Каталог жилых комплексов
            </h1>
            <p className="mt-4 text-[var(--text-2)]">
              Новостройки Москвы от {fmt(PRICE_THRESHOLD_PER_SQM)}&nbsp;₽/м²
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/units"
              className="text-sm font-medium text-[var(--gold-dark)] hover:text-[var(--gold)] transition-colors whitespace-nowrap"
            >
              Каталог квартир →
            </Link>
          </div>
        </div>

        {/* Filters placeholder */}
        <div className="mt-8 flex flex-wrap gap-2">
          {["Все", "Deluxe", "Premium", "Business+"].map((cls) => (
            <button
              key={cls}
              className={`px-4 py-2 text-sm border transition-colors ${
                cls === "Все"
                  ? "bg-[var(--gold)] text-[var(--dark)] border-[var(--gold)]"
                  : "border-[var(--cream-2)] text-[var(--text-2)] hover:border-[var(--gold)]/40"
              }`}
            >
              {cls}
            </button>
          ))}
        </div>

        {/* Project grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLACEHOLDER_PROJECTS.map((project) => (
            <ProjectCard key={project.slug} {...project} />
          ))}
        </div>

        {/* Note */}
        <p className="mt-12 text-center text-sm text-[var(--gray)]">
          Данные обновляются по мере подключения источников.
          Свяжитесь с нами для актуальной информации по любому проекту.
        </p>
      </div>
    </div>
  );
}

function ProjectCard({
  slug,
  name,
  developer,
  district,
  metro,
  priceFrom,
  status,
  completionYear,
  projectClass,
}: (typeof PLACEHOLDER_PROJECTS)[number]) {
  return (
    <div className="group border border-[var(--cream-2)] hover:border-[var(--gold)]/40 bg-[var(--bg)] hover:bg-white transition-all">
      {/* Image placeholder */}
      <div className="aspect-[16/10] bg-[var(--cream)] flex items-center justify-center">
        <span className="font-serif text-2xl text-[var(--gold)]/20">{name.charAt(0)}</span>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-serif text-lg text-[var(--dark)] group-hover:text-[var(--gold-dark)] transition-colors">
              {name}
            </h2>
            <p className="text-xs text-[var(--gray)] mt-0.5">{developer}</p>
          </div>
          <span className="flex-shrink-0 text-[10px] px-2 py-0.5 bg-[var(--cream)] text-[var(--gold-dark)] font-medium">
            {projectClass}
          </span>
        </div>

        <div className="mt-4 space-y-1.5 text-sm text-[var(--text-2)]">
          <div className="flex justify-between">
            <span className="text-[var(--gray)]">Район</span>
            <span>{district}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--gray)]">Метро</span>
            <span>{metro}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--gray)]">Сдача</span>
            <span>{completionYear}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--cream-2)] flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--gray)]">от</p>
            <p className="font-serif text-lg text-[var(--gold-dark)]">
              {fmt(priceFrom)} ₽/м²
            </p>
          </div>
          <span className="text-[10px] px-2 py-0.5 bg-green-50 text-green-700 border border-green-200">
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}
