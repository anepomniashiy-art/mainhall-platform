/** Price threshold for qualifying projects — RUB per m² */
export const PRICE_THRESHOLD_PER_SQM = 600_000;

/** Brand colors — inherited from original MAINHALL design */
export const BRAND = {
  gold: "#BFA066",
  goldLight: "#D4BC8A",
  goldDark: "#9A8050",
  dark: "#17140F",
  dark2: "#1E1B15",
  dark3: "#252219",
  cream: "#F5F0E8",
  cream2: "#EDE7DB",
  bg: "#FAF8F4",
  bg2: "#F2EDE4",
  white: "#FFFFFF",
  text: "#2A2720",
  text2: "#5A5548",
  gray: "#8A8578",
  grayLight: "#B5AFA3",
} as const;

/** Company info */
export const COMPANY = {
  name: "MAINHALL",
  domain: "main-hall.ru",
  phone: "+7 926 917-99-01",
  email: "hello@main-hall.ru",
  telegram: "https://t.me/anepomniashiy",
  whatsapp: "https://wa.me/79269179901",
  tagline: "Инвестиции в премиальную недвижимость Москвы",
} as const;

/** Target developers for Moscow 600K+ segment */
export const TARGET_DEVELOPERS = [
  { name: "Sminex", url: "https://www.sminex.com/" },
  { name: "Vesper", url: "https://www.vespermoscow.com/" },
  { name: "Capital Group", url: "https://www.capitalgroup.ru/" },
  { name: "MR Group", url: "https://www.mr-group.ru/" },
  { name: "PIONEER", url: "https://pioneer.ru/" },
  { name: "ANT Development", url: "https://antdev.ru/" },
  { name: "Hutton", url: "https://hutton.ru/" },
  { name: "Coldy", url: "https://coldy.ru/" },
  { name: "October Group", url: "https://october-group.ru/" },
  { name: "Upside Development", url: "https://upsidedev.ru/" },
  { name: "STONE", url: "https://stonehedge.ru/" },
  { name: "Level Group", url: "https://levelgroup.ru/" },
] as const;
