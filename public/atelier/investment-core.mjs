/**
 * MAINHALL cash-purchase scenario calculator.
 * All percentages, rent, costs and future price changes are explicit inputs.
 * No market forecasts, tax regimes, financing or reinvestment are assumed here.
 */

const FIELDS = {
  price: ['Цена квартиры', 0, Infinity, true],
  discountPct: ['Скидка', 0, 100, false, true],
  renovation: ['Ремонт', 0, Infinity],
  furniture: ['Мебель и оснащение', 0, Infinity],
  acquisitionCosts: ['Расходы на покупку', 0, Infinity],
  monthlyRent: ['Аренда в месяц', 0, Infinity],
  vacancyPct: ['Простой', 0, 100],
  managementPct: ['Управление', 0, 100],
  annualFixedCosts: ['Постоянные расходы в год', 0, Infinity],
  rentalTaxPct: ['Налог с полученной аренды', 0, 100],
  holdingYears: ['Горизонт владения', 0, 100, true],
  annualGrowthPct: ['Изменение цены в год', -100, 100],
  sellingCostPct: ['Расходы на продажу', 0, 100],
  targetYieldPct: ['Целевая чистая доходность', 0, 100],
  waitMonths: ['Ожидание до начала аренды', 0, 1200],
};

function toNumber(raw) {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== 'string' || raw.trim() === '') return null;
  const text = raw.trim().replace(/[\s\u00a0\u202f]/gu, '').replace(',', '.');
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/iu.test(text)) return null;
  const result = Number(text);
  return Number.isFinite(result) ? result : null;
}

/** Missing inputs remain missing: blank/null never silently become zero. */
export function validateInvestmentInputs(raw = {}) {
  const errors = [], values = {};
  for (const [field, [label, min, max, exclusiveMin, exclusiveMax]] of Object.entries(FIELDS)) {
    const value = toNumber(raw?.[field]);
    if (value === null) {
      errors.push({field, message: `Укажите значение: ${label.toLocaleLowerCase('ru')}.`});
      continue;
    }
    if ((exclusiveMin ? value <= min : value < min) || (exclusiveMax ? value >= max : value > max)) {
      let message;
      if (max === Infinity) message = `${label}: значение должно быть ${exclusiveMin ? 'больше' : 'не меньше'} ${min}.`;
      else message = `${label}: допустимый диапазон ${exclusiveMin ? 'больше ' : 'от '}${min} ${exclusiveMax ? 'и меньше' : 'до'} ${max}.`;
      errors.push({field, message});
      continue;
    }
    values[field] = Object.is(value, -0) ? 0 : value;
  }
  if (Number.isFinite(values.managementPct) && Number.isFinite(values.rentalTaxPct)
    && values.managementPct + values.rentalTaxPct > 100) {
    errors.push({field: 'managementPct', message: 'Управление и налог с аренды вместе не должны превышать 100% полученной аренды.'});
  }
  if (!errors.length) {
    const capital = values.price * (1 - values.discountPct / 100)
      + values.renovation + values.furniture + values.acquisitionCosts;
    if (!Number.isFinite(capital) || capital <= 0)
      errors.push({field: 'price', message: 'Полная сумма вложений должна быть положительным конечным числом.'});
  }
  return {valid: errors.length === 0, errors, values: errors.length ? null : values};
}

const number = value => new Intl.NumberFormat('ru-RU', {maximumFractionDigits: 2}).format(value);
const rubles = value => new Intl.NumberFormat('ru-RU', {maximumFractionDigits: 0}).format(value) + ' ₽';
const missingRecommendation = errors => ({
  category: 'insufficient-data',
  title: 'Для вывода нужны исходные данные',
  why: errors.map(error => error.message),
});

function recommend(v, result) {
  const why = [];
  if (result.netAnnual <= 0) {
    why.push(`При заданных условиях аренда даёт ${rubles(result.netAnnual)} в год после расходов.`);
    why.push('Арендный поток не окупает вложения: нужно изменить цену, аренду или расходы.');
    return {category: 'exclude', title: 'Не подходит для дохода от аренды при этих условиях', why};
  }
  why.push(`Чистая доходность после запуска аренды — ${number(result.netYieldPct)}% годовых на все вложенные средства.`);
  if (result.netProfit < 0) {
    why.push(`На горизонте ${number(v.holdingYears)} ${v.holdingYears === 1 ? 'года' : 'лет'} модель показывает убыток ${rubles(-result.netProfit)} с учётом продажи.`);
    why.push('Текущие условия не проходят проверку горизонта: рассмотрите другую цену входа, расходы или срок владения.');
    return {category: 'exclude', title: 'Не подходит на выбранном горизонте при этих условиях', why};
  }
  if (v.targetYieldPct <= 0) {
    why.push('Задайте целевую чистую доходность, чтобы сравнить результат с вашей задачей.');
    return {category: 'no-target', title: 'Расчёт готов — задайте цель для рекомендации', why};
  }
  why.push(`Ваша цель — ${number(v.targetYieldPct)}% годовых от аренды.`);
  if (result.netYieldPct + 1e-9 < v.targetYieldPct) {
    if (result.maxPurchasePriceRub !== null) {
      why.push(`При неизменной аренде и расходах цена самой квартиры для достижения цели — не выше ${rubles(result.maxPurchasePriceRub)}.`);
    } else {
      why.push('Одного снижения цены квартиры недостаточно: при этих дополнительных вложениях нужно также увеличить чистый арендный доход.');
    }
    return {category: 'improve-terms', title: 'Покупку стоит рассматривать после улучшения условий', why};
  }
  if (v.waitMonths > 0) why.push(`Доход начинается через ${number(v.waitMonths)} мес.; срок окупаемости учитывает ожидание и расходы этого периода.`);
  why.push('Модель соответствует введённой цели. Вывод действует только при подтверждении цены, аренды, расходов и параметров квартиры.');
  return {category: 'meets-target', title: 'Можно рассматривать: модель соответствует вашей цели', why};
}

/**
 * Annual rent: rent received after vacancy, minus management/tax as percentages
 * of received rent, minus annual fixed costs. It is an unlevered cash-flow model.
 *
 * Horizon starts on purchase. Fixed costs continue during waiting; rent does not.
 * Exit-price growth applies to the discounted apartment price, not renovation.
 * annualizedTotalReturnPct is annualized aggregate wealth with rent accumulated
 * as cash, NOT IRR and NOT a reinvestment yield.
 */
export function calculateInvestment(raw) {
  const validation = validateInvestmentInputs(raw);
  if (!validation.valid) return {valid: false, errors: validation.errors, recommendation: missingRecommendation(validation.errors)};
  const v = validation.values;
  const purchasePrice = v.price * (1 - v.discountPct / 100);
  const additionalCapital = v.renovation + v.furniture + v.acquisitionCosts;
  const totalCapital = purchasePrice + additionalCapital;
  const grossScheduled = v.monthlyRent * 12;
  const occupiedRent = grossScheduled * (1 - v.vacancyPct / 100);
  const managementFee = occupiedRent * v.managementPct / 100;
  const taxOnOccupiedRent = occupiedRent * v.rentalTaxPct / 100;
  const rentalRetention = Math.max(0, 1 - (v.managementPct + v.rentalTaxPct) / 100);
  const variableNetAnnual = occupiedRent * rentalRetention;
  const netAnnual = variableNetAnnual - v.annualFixedCosts;
  const netYieldPct = netAnnual / totalCapital * 100;
  const waitYears = v.waitMonths / 12;
  const operatingPaybackYears = netAnnual > 0 ? totalCapital / netAnnual : null;
  const simplePaybackYears = netAnnual > 0
    ? waitYears + (totalCapital + v.annualFixedCosts * waitYears) / netAnnual : null;
  const rentMonths = Math.max(0, v.holdingYears * 12 - v.waitMonths);
  const activeRentYears = rentMonths / 12;
  const rentReceivedHorizon = occupiedRent * activeRentYears;
  const managementFeeHorizon = managementFee * activeRentYears;
  const taxOnRentHorizon = taxOnOccupiedRent * activeRentYears;
  const fixedCostsHorizon = v.annualFixedCosts * v.holdingYears;
  const rentNetHorizon = variableNetAnnual * activeRentYears - fixedCostsHorizon;
  const exitGross = purchasePrice * Math.pow(1 + v.annualGrowthPct / 100, v.holdingYears);
  const sellingCosts = exitGross * v.sellingCostPct / 100;
  const exitNet = exitGross - sellingCosts;
  const terminalWealth = exitNet + rentNetHorizon;
  const netProfit = terminalWealth - totalCapital;
  const totalReturnPct = netProfit / totalCapital * 100;
  const annualizedTotalReturnPct = terminalWealth >= 0
    ? (Math.pow(terminalWealth / totalCapital, 1 / v.holdingYears) - 1) * 100 : null;
  const annualNetPerMonthlyRub = 12 * (1 - v.vacancyPct / 100) * rentalRetention;
  const breakEvenMonthlyRent = annualNetPerMonthlyRub > 0
    ? v.annualFixedCosts / annualNetPerMonthlyRub : v.annualFixedCosts === 0 ? 0 : null;
  const monthlyRentForTargetYield = annualNetPerMonthlyRub > 0
    ? (v.annualFixedCosts + totalCapital * v.targetYieldPct / 100) / annualNetPerMonthlyRub : null;
  const targetCapital = v.targetYieldPct > 0 && netAnnual > 0 ? netAnnual / (v.targetYieldPct / 100) : null;
  const candidatePrice = targetCapital === null ? null : targetCapital - additionalCapital;
  const maxPurchasePriceRub = candidatePrice !== null && candidatePrice > 0 ? candidatePrice : null;
  const requiredDiscountPct = maxPurchasePriceRub !== null
    ? Math.max(0, (1 - maxPurchasePriceRub / v.price) * 100) : null;
  const result = {
    valid: true, errors: [], inputs: v,
    purchasePrice, priceAfterDiscount: purchasePrice, additionalCapital, totalCapital,
    grossScheduled, occupiedRent, managementFee, taxOnOccupiedRent,
    annualFixedCosts: v.annualFixedCosts, variableNetAnnual, netAnnual, netYieldPct,
    operatingPaybackYears, simplePaybackYears,
    holdingYears: v.holdingYears, waitMonths: v.waitMonths, rentMonths, activeRentYears,
    rentReceivedHorizon, managementFeeHorizon, taxOnRentHorizon, fixedCostsHorizon, rentNetHorizon,
    exitGross, sellingCosts, exitNet, cashExit: exitNet, terminalWealth, netProfit,
    totalReturnPct, annualizedTotalReturnPct,
    breakEvenMonthlyRent, monthlyRentForTargetYield, maxPurchasePriceRub, requiredDiscountPct,
  };
  if (Object.values(result).some(value => typeof value === 'number' && !Number.isFinite(value))) {
    const errors = [{field: 'calculation', message: 'Значения слишком велики для надёжного расчёта. Уменьшите исходные параметры.'}];
    return {valid: false, errors, recommendation: missingRecommendation(errors)};
  }
  result.recommendation = recommend(v, result);
  return result;
}
