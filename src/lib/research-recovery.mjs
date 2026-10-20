/** Status of investment research the owner asked to recover (issue #18).
 * Nothing here is a price, return or installment term. An item becomes
 * `recovered` only after the original file is in this repo with its source
 * URL and date. Until then, the site must not show its content.
 */
export const searchedLocations = [
  {where: 'anepomniashiy-art/mainhall-platform: all tracked files and full git history (147 commits)', result: 'searched'},
  {where: 'mainhall-platform issues #1, #2, #3, #6, #7 with comments', result: 'searched'},
  {where: 'anepomniashiy-art/north-cyprus (PHOTO_MAP.md, MAINHALL_BRIEF.md, archive, team HTML)', result: 'blocked: HTTP 404, Action token is scoped to mainhall-platform only'},
  {where: 'Web (re-collection from public sources)', result: 'not done: WebSearch permission denied in this run'},
];

export const researchItems = [
  {slug: 'kvartal-serebryany-bor', title: 'Квартал Серебряный бор: инвест-обзор', kind: 'project_review'},
  {slug: 'kvartal-izdanie', title: 'Квартал Издание: инвест-обзор', kind: 'project_review'},
  {slug: 'u2', title: 'U2: инвест-обзор', kind: 'project_review'},
  {slug: 'kvartal-na-vode', title: 'Квартал на воде: инвест-обзор', kind: 'project_review'},
  {slug: 'yuzhny-port', title: 'Район Южный порт: катализаторы', kind: 'district_catalysts',
    relatedInRepo: 'src/lib/editorial-projects.ts → level-yuzhnoportovaya (editorial entry, no prices)'},
  {slug: 'installment-catalogue', title: 'Каталог и сравнение рассрочек', kind: 'installment_comparison'},
].map(item => ({
  ...item,
  status: 'not_recovered',
  expectedLocation: 'anepomniashiy-art/north-cyprus or the owner\'s earlier chat outputs',
  sourceUrls: [],
  originalDate: null,
  facts: [],
  scenarios: [],
}));
