import Link from "next/link";
import { COMPANY, TARGET_DEVELOPERS, PRICE_THRESHOLD_PER_SQM } from "@/lib/constants";

function formatPrice(n: number) {
  return new Intl.NumberFormat("ru-RU").format(n);
}

export default function HomePage() {
  return (
    <>
      {/* ─── HERO ─── */}
      <section className="relative bg-[var(--dark)] overflow-hidden">
        {/* Subtle gold gradient accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold)]/5 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="max-w-3xl">
            <p className="text-[var(--gold)] text-sm font-medium tracking-[0.2em] uppercase mb-6">
              Инвестиционное агентство
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[var(--cream)] leading-tight">
              Премиальная недвижимость{" "}
              <span className="text-[var(--gold)]">Москвы</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-[var(--cream)]/60 leading-relaxed max-w-2xl">
              Новостройки от ведущих девелоперов с ценой
              от&nbsp;{formatPrice(PRICE_THRESHOLD_PER_SQM)}&nbsp;₽/м².
              Полный каталог квартир, аналитика цен и персональные
              инвестиционные стратегии.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href="/projects"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-[var(--gold)] text-[var(--dark)] font-medium text-sm tracking-wide hover:bg-[var(--gold-light)] transition-colors"
              >
                Смотреть проекты
              </Link>
              <Link
                href="/#contact"
                className="inline-flex items-center justify-center px-8 py-3.5 border border-[var(--gold)]/30 text-[var(--gold)] font-medium text-sm tracking-wide hover:border-[var(--gold)] transition-colors"
              >
                Получить консультацию
              </Link>
            </div>
          </div>

          {/* Key metrics */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { value: "12", label: "девелоперов", sublabel: "в портфеле" },
              { value: "800К+", label: "₽/м²", sublabel: "от" },
              { value: "50+", label: "проектов", sublabel: "в Москве" },
              { value: "24/7", label: "аналитика", sublabel: "цен и наличия" },
            ].map((stat) => (
              <div key={stat.label} className="text-center sm:text-left">
                <p className="font-serif text-2xl sm:text-3xl text-[var(--gold)]">
                  {stat.value}
                </p>
                <p className="text-sm text-[var(--cream)]/50 mt-1">
                  <span className="text-[var(--cream)]/70">{stat.label}</span>{" "}
                  {stat.sublabel}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ABOUT ─── */}
      <section id="about" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-[var(--gold)] text-sm font-medium tracking-[0.2em] uppercase mb-4">
              О компании
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-[var(--dark)] leading-tight">
              Ваш проводник в мире премиальных
              инвестиций
            </h2>
            <p className="mt-6 text-[var(--text-2)] leading-relaxed">
              MAINHALL — инвестиционное агентство, специализирующееся
              на премиальной жилой недвижимости Москвы. Мы работаем
              с&nbsp;ведущими девелоперами и предоставляем полную аналитику
              по проектам от&nbsp;{formatPrice(PRICE_THRESHOLD_PER_SQM)}&nbsp;₽/м²:
              динамику цен, доступность квартир и инвестиционную доходность.
            </p>
          </div>

          {/* Strategy steps */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Анализ",
                desc: "Изучаем ваш инвестиционный профиль, бюджет и горизонт вложений",
              },
              {
                step: "02",
                title: "Подбор",
                desc: "Находим оптимальные проекты и лоты на основе данных рынка",
              },
              {
                step: "03",
                title: "Сделка",
                desc: "Сопровождаем на всех этапах покупки — от брони до ДДУ",
              },
              {
                step: "04",
                title: "Управление",
                desc: "Мониторим рост стоимости и помогаем с дальнейшей стратегией",
              },
            ].map((item) => (
              <div key={item.step} className="group">
                <span className="font-serif text-3xl text-[var(--gold)]/30 group-hover:text-[var(--gold)] transition-colors">
                  {item.step}
                </span>
                <h3 className="mt-3 font-serif text-xl text-[var(--dark)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--text-2)] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DEVELOPERS ─── */}
      <section className="py-20 sm:py-28 bg-[var(--cream)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-[var(--gold-dark)] text-sm font-medium tracking-[0.2em] uppercase mb-4">
              Партнёры
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-[var(--dark)]">
              Ведущие девелоперы Москвы
            </h2>
            <p className="mt-4 text-[var(--text-2)]">
              Работаем напрямую с топовыми застройщиками премиального сегмента
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {TARGET_DEVELOPERS.map((dev) => (
              <Link
                key={dev.name}
                href={`/developers`}
                className="flex items-center justify-center h-20 px-6 bg-[var(--bg)] border border-[var(--cream-2)] hover:border-[var(--gold)]/40 hover:shadow-sm transition-all group"
              >
                <span className="font-serif text-sm sm:text-base text-[var(--text-2)] group-hover:text-[var(--gold-dark)] transition-colors text-center">
                  {dev.name}
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/developers"
              className="inline-flex items-center text-sm font-medium text-[var(--gold-dark)] hover:text-[var(--gold)] transition-colors"
            >
              Все девелоперы →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section id="contact" className="py-20 sm:py-28 bg-[var(--dark)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl text-[var(--cream)]">
            Готовы инвестировать?
          </h2>
          <p className="mt-4 text-[var(--cream)]/50 max-w-xl mx-auto">
            Оставьте заявку, и мы подберём для вас лучшие инвестиционные
            лоты с учётом ваших целей и бюджета
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={COMPANY.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-[var(--gold)] text-[var(--dark)] font-medium text-sm tracking-wide hover:bg-[var(--gold-light)] transition-colors"
            >
              Написать в Telegram
            </a>
            <a
              href={COMPANY.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3.5 border border-[var(--gold)]/30 text-[var(--gold)] font-medium text-sm tracking-wide hover:border-[var(--gold)] transition-colors"
            >
              Написать в WhatsApp
            </a>
            <a
              href={`tel:${COMPANY.phone.replace(/[\s()-]/g, "")}`}
              className="inline-flex items-center justify-center px-8 py-3.5 border border-[var(--gold)]/30 text-[var(--gold)] font-medium text-sm tracking-wide hover:border-[var(--gold)] transition-colors"
            >
              {COMPANY.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
