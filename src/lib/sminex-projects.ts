import portfolio from "../../data/catalogue/sminex-portfolio.json";
import type { ProjectEntry } from "./editorial-projects";

/** Official developer portfolio, not an inventory of apartments for sale.
 * Managed properties and future launches retain their own source statuses.
 * Public website metadata must never override a later authorised unit feed.
 */
export const sminexPortfolio = portfolio.projects;
export const sminexResidentialPortfolio = sminexPortfolio.filter(p => p.propertyType !== "commercial");
export const sminexCommercialPortfolio = sminexPortfolio.filter(p => p.propertyType === "commercial");

const checksFor = (status: string) => status === "coming_soon"
 ? ["Состав жилой и коммерческой частей по проектной документации", "Дата открытия продаж и условия бронирования", "Сроки реализации после официального раскрытия"]
 : status === "managed"
 ? ["Наличие конкретного помещения и основание продажи", "Назначение помещения и документы собственника", "Действующие платежи и условия управляющей компании"]
 : ["Актуальное предложение и цена выбранного помещения", "Документы, сроки и условия договора", "Планировка, ориентация окон и фактические эксплуатационные расходы"];

export const sminexEditorialProjects: ProjectEntry[] = sminexResidentialPortfolio.map(p => {
 if (!p.editorial) throw new Error(`Missing Sminex editorial facts: ${p.slug}`);
 return {
  slug: p.slug, name: p.editorial.name, developer: "Sminex",
  area: p.districtOfficial || p.addressOfficial,
  className: p.editorial.className as ProjectEntry["className"],
  sourceUrl: p.officialProjectUrl || p.officialRegistryUrl,
  summary: p.editorial.summary, thesis: p.editorial.thesis,
  dueDiligence: checksFor(p.statusNormalized),
  statusNormalized: p.statusNormalized as ProjectEntry["statusNormalized"],
  statusOfficial: p.statusOfficial || undefined,
  propertyType: p.propertyType as ProjectEntry["propertyType"],
 };
});

export const sminexProjectImages = Object.fromEntries(sminexPortfolio.map(p => [p.slug, {
 src: p.localImage,
 caption: `${p.editorial?.name || p.name} · Sminex · официальный материал проекта`,
}]));

export const sminexProjectDossiers = Object.fromEntries(sminexResidentialPortfolio.map(p => {
 const e = p.editorial!;
 return [p.slug, {
  address: `Москва, ${p.addressOfficial}`, format: e.format,
  features: [e.summary, p.statusOfficial ? `Статус в портфеле Sminex: ${p.statusOfficial}.` : "Статус реализации в исходном портфеле не указан.",
   ...(p.propertyType === "mixed_residential_commercial" ? ["В проекте предусмотрены жилая и коммерческая составляющие."] : [])],
  location: `${e.name}: ${p.addressOfficial}.${p.districtOfficial ? ` Официально указан район: ${p.districtOfficial}.` : ""}`,
  thesis: e.thesis, checks: checksFor(p.statusNormalized),
  source: p.officialProjectUrl || p.officialRegistryUrl,
  checkedAt: "21.10.2026",
 }];
}));
