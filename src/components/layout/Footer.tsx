import Link from "next/link";
import { COMPANY } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mh-footer">
      <div className="mh-footer-heading">
        <Link href="/" className="mh-footer-brand" aria-label="Mainhall — главная">Mainhall</Link>
        <p>Жилая и коммерческая недвижимость Москвы</p>
      </div>
      <nav className="mh-footer-directory" aria-label="Разделы сайта">
        <div>
          <p>Недвижимость</p>
          <Link href="/units/">Квартиры и планировки</Link>
          <Link href="/projects/">Жилые комплексы</Link>
          <Link href="/districts/">Районы Москвы</Link>
          <Link href="/collections/">Подборки проектов</Link>
          <Link href="/developers/">Застройщики</Link>
          <Link href="/commercial/">Коммерческая недвижимость</Link>
        </div>
        <div>
          <p>Покупателю</p>
          <Link href="/installments/">Рассрочки и калькулятор</Link>
          <Link href="/analytics/">Аналитика и обзоры</Link>
          <Link href="/analytics/kak-sravnit-novostroyki/">Как сравнить новостройки</Link>
          <Link href="/analytics/kvartira-dlya-arendy/">Квартира для аренды</Link>
          <Link href="/investment-rating/">Критерии оценки</Link>
        </div>
        <div>
          <p>Mainhall</p>
          <Link href="/about/">Агентство и команда</Link>
          <Link href="/contacts/">Контакты</Link>
          <a href={"tel:" + COMPANY.phone.replace(/[\s()-]/g, "")}>{COMPANY.phone}</a>
          <a href={COMPANY.telegram} target="_blank" rel="noopener noreferrer">Telegram</a>
        </div>
      </nav>
      <div className="mh-footer-legal">
        <span>© 2026 Mainhall</span>
        <span>Информация не является публичной офертой.</span>
      </div>
    </footer>
  );
}
