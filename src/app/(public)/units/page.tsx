import type { Metadata } from "next";
import { PRICE_THRESHOLD_PER_SQM } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Каталог квартир",
  description:
    "Квартиры в премиальных новостройках Москвы от 800 000 ₽/м². Поиск по площади, этажу, комнатности и цене.",
};

/** Placeholder unit data — will be replaced with DB queries */
const PLACEHOLDER_UNITS = [
  {
    id: "u1",
    project: "Лаврушинский",
    developer: "Sminex",
    rooms: 3,
    area: 127.4,
    floor: 12,
    priceTotal: 165_620_000,
    pricePerSqm: 1_300_000,
    status: "available" as const,
  },
  {
    id: "u2",
    project: "Бадаевский",
    developer: "Capital Group",
    rooms: 2,
    area: 89.6,
    floor: 8,
    priceTotal: 134_400_000,
    pricePerSqm: 1_500_000,
    status: "available" as const,
  },
  {
    id: "u3",
    project: "Grand Tower",
    developer: "MR Group",
    rooms: 1,
    area: 52.3,
    floor: 24,
    priceTotal: 49_685_000,
    pricePerSqm: 950_000,
    status: "available" as const,
  },
  {
    id: "u4",
    project: "Cloud Nine",
    developer: "Vesper",
    rooms: 4,
    area: 210.0,
    floor: 15,
    priceTotal: 189_000_000,
    pricePerSqm: 900_000,
    status: "reserved" as const,
  },
  {
    id: "u5",
    project: "STONE Towers",
    developer: "STONE",
    rooms: 2,
    area: 75.0,
    floor: 18,
    priceTotal: 63_000_000,
    pricePerSqm: 840_000,
    status: "available" as const,
  },
  {
    id: "u6",
    project: "City Bay",
    developer: "MR Group",
    rooms: 1,
    area: 46.8,
    floor: 30,
    priceTotal: 38_376_000,
    pricePerSqm: 820_000,
    status: "available" as const,
  },
];

function fmt(n: number) {
  return new Intl.NumberFormat("ru-RU").format(n);
}

const STATUS_LABELS: Record<string, { text: string; classes: string }> = {
  available: { text: "В продаже", classes: "bg-green-50 text-green-700 border-green-200" },
  reserved: { text: "Бронь", classes: "bg-amber-50 text-amber-700 border-amber-200" },
  sold: { text: "Продано", classes: "bg-red-50 text-red-600 border-red-200" },
};

export default function UnitsPage() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl">
          <p className="text-[var(--gold)] text-sm font-medium tracking-[0.2em] uppercase mb-4">
            Каталог
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-[var(--dark)]">
            Квартиры в новостройках
          </h1>
          <p className="mt-4 text-[var(--text-2)]">
            Актуальные лоты от {fmt(PRICE_THRESHOLD_PER_SQM)}&nbsp;₽/м²
          </p>
        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-wrap gap-3">
          {["Все", "Студия", "1к", "2к", "3к", "4к+"].map((r) => (
            <button
              key={r}
              className={`px-4 py-2 text-sm border transition-colors ${
                r === "Все"
                  ? "bg-[var(--gold)] text-[var(--dark)] border-[var(--gold)]"
                  : "border-[var(--cream-2)] text-[var(--text-2)] hover:border-[var(--gold)]/40"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Table (desktop) */}
        <div className="mt-8 hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--cream-2)] text-left text-xs text-[var(--gray)] uppercase tracking-wider">
                <th className="pb-3 pr-4">Проект</th>
                <th className="pb-3 pr-4">Девелопер</th>
                <th className="pb-3 pr-4 text-center">Комнат</th>
                <th className="pb-3 pr-4 text-right">Площадь</th>
                <th className="pb-3 pr-4 text-center">Этаж</th>
                <th className="pb-3 pr-4 text-right">Цена</th>
                <th className="pb-3 pr-4 text-right">₽/м²</th>
                <th className="pb-3 text-center">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--cream-2)]">
              {PLACEHOLDER_UNITS.map((u) => {
                const s = STATUS_LABELS[u.status] ?? STATUS_LABELS.available;
                return (
                  <tr key={u.id} className="hover:bg-[var(--cream)]/30 transition-colors">
                    <td className="py-3 pr-4 font-serif text-[var(--dark)]">{u.project}</td>
                    <td className="py-3 pr-4 text-[var(--text-2)]">{u.developer}</td>
                    <td className="py-3 pr-4 text-center text-[var(--text-2)]">{u.rooms}</td>
                    <td className="py-3 pr-4 text-right text-[var(--text-2)]">
                      {u.area} м²
                    </td>
                    <td className="py-3 pr-4 text-center text-[var(--text-2)]">{u.floor}</td>
                    <td className="py-3 pr-4 text-right font-medium text-[var(--dark)]">
                      {fmt(u.priceTotal)} ₽
                    </td>
                    <td className="py-3 pr-4 text-right text-[var(--gold-dark)]">
                      {fmt(u.pricePerSqm)}
                    </td>
                    <td className="py-3 text-center">
                      <span className={`text-[10px] px-2 py-0.5 border ${s.classes}`}>
                        {s.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Cards (mobile) */}
        <div className="mt-8 lg:hidden space-y-4">
          {PLACEHOLDER_UNITS.map((u) => {
            const s = STATUS_LABELS[u.status] ?? STATUS_LABELS.available;
            return (
              <div
                key={u.id}
                className="border border-[var(--cream-2)] bg-[var(--bg)] p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif text-base text-[var(--dark)]">{u.project}</h3>
                    <p className="text-xs text-[var(--gray)]">{u.developer}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 border ${s.classes}`}>
                    {s.text}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-[10px] text-[var(--gray)]">Комнат</p>
                    <p className="text-[var(--text-2)]">{u.rooms}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--gray)]">Площадь</p>
                    <p className="text-[var(--text-2)]">{u.area} м²</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--gray)]">Этаж</p>
                    <p className="text-[var(--text-2)]">{u.floor}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-[var(--cream-2)] flex items-center justify-between">
                  <div>
                    <p className="font-serif text-lg text-[var(--dark)]">{fmt(u.priceTotal)} ₽</p>
                    <p className="text-xs text-[var(--gold-dark)]">{fmt(u.pricePerSqm)} ₽/м²</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-12 text-center text-sm text-[var(--gray)]">
          Показаны демонстрационные данные. Реальные лоты появятся после подключения
          источников данных от девелоперов.
        </p>
      </div>
    </div>
  );
}
