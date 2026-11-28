import data from "../../data/catalogue/investment-rating.json";

export type RatingCriterion = "price" | "location" | "liquidity" | "timing" | "rent";
export type ProjectRating = {
 published: boolean; withheld?: "elite"; score: number | null; confidence: "high" | "medium" | "low" | null; missing: string[]; flags: string[];
 price: null | { score: number; pricePerSqm: number; diffPercent: number; comparables: number; comparableDeals: number; radiusKm: number | null; deals: number; windowMonths: number; finish: string | null; sameFinish?: boolean; capped: boolean; penalty: number };
 location: null | { score: number; metro: string | null; minutes: number | null; onFoot: boolean | null; estimated?: boolean; schools: number; kindergartens: number; shops: number; clinics: number; parkMeters: number | null; futureStation: null | { name: string; year: number | null; meters: number }; bonus: number };
 liquidity: null | { score: number; stock: number; dealsSixMonths: number; monthsOfStock: number; wholesalePercent: number; exposureDays: number | null; assignments: number; monthsOnSale: number; adjusted: boolean };
 timing: null | { score: number; completed?: boolean; plannedDate: string | null; monthsTo: number | null; projectShiftMonths: number | null; developerBuildings: number | null; developerMedianShift: number | null; developerOnTimePercent: number | null };
 rent: null | { score: number; rentPerSqm: number; listings: number; radiusKm: number; grossYield: number; netYield: number; rooms: string };
};
type RatingFile = { asOf: string; dealsThrough: string; dealWindow: [string, string]; registryDate: string; rentWindow: [string, string] | null; weights: Record<RatingCriterion, number>; projects: Record<string, ProjectRating> };
const file = data as unknown as RatingFile;
export const ratingMeta = { asOf: file.asOf, dealsThrough: file.dealsThrough, dealWindow: file.dealWindow, registryDate: file.registryDate, rentWindow: file.rentWindow, weights: file.weights };
export const ratingBySlug = (slug: string): ProjectRating | undefined => file.projects[slug];
export const publishedRatings = Object.entries(file.projects).filter(([, r]) => r.published && r.score !== null).map(([slug, r]) => ({ slug, rating: r })).sort((a, b) => (b.rating.score as number) - (a.rating.score as number));
export const ratingCounts = { published: publishedRatings.length, total: Object.keys(file.projects).length, withheld: Object.values(file.projects).filter(r => r.withheld).length };
export const criterionNames: Record<RatingCriterion, string> = { price: "Цена покупки", location: "Район и инфраструктура", liquidity: "Спрос и ликвидность", timing: "Сроки сдачи", rent: "Экономика аренды" };
export const ruDate = (iso: string) => { const [y, m, d] = iso.split("-"); const months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"]; return d ? `${Number(d)} ${months[Number(m) - 1]} ${y} года` : `${months[Number(m) - 1]} ${y}`; };
