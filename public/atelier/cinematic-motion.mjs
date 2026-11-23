/** Keep native scrolling and load a new scene only when it is needed. */
const hero = document.querySelector('#cinema-hero');
const body = document.body;
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const revealElements = document.querySelectorAll('[data-cinema-reveal]');
const controls = hero.querySelector('.cinema-controls');
const slides = [...hero.querySelectorAll('.cinema-frame')];
const steps = [...controls.querySelectorAll('[data-cinema-step]')];
const pauseButton = controls.querySelector('[data-cinema-pause]');
const sceneDuration = Number.parseInt(getComputedStyle(hero).getPropertyValue('--scene-duration'), 10);

let active = 0;
let request = 0;
let timer = 0;
let frame = 0;
let heroVisible = true;
let paused = false;
let revealObserver;

const homeRoute = () => !/^#(?:project|unit)\//.test(window.location.hash);
const canPlay = () => heroVisible && homeRoute() && !document.hidden && !paused && !motionPreference.matches;

function resetHeroMotion() {
  hero.style.setProperty('--hero-image-y', '0px');
  hero.style.setProperty('--hero-copy-y', '0px');
}

function renderMotion() {
  frame = 0;
  const atHome = homeRoute();
  body.classList.toggle('cinematic-home', atHome);
  body.classList.toggle('cinematic-scrolled', !atHome || window.scrollY > 56);
  if (!atHome || motionPreference.matches || paused) {
    resetHeroMotion();
    return;
  }
  const bounds = hero.getBoundingClientRect();
  if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) return;
  const distance = Math.max(0, -bounds.top);
  hero.style.setProperty('--hero-image-y', `${Math.min(63, distance * .105).toFixed(2)}px`);
  hero.style.setProperty('--hero-copy-y', `${Math.min(20, distance * .035).toFixed(2)}px`);
}

function requestRender() {
  if (!frame) frame = window.requestAnimationFrame(renderMotion);
}

function stopTimer() {
  window.clearTimeout(timer);
  controls.removeAttribute('data-playing');
}

function scheduleNext(after = active) {
  stopTimer();
  hero.dataset.motionPaused = String(!canPlay());
  if (!canPlay()) return;
  timer = window.setTimeout(() => showScene((after + 1) % slides.length, true), sceneDuration);
  if (after === active) controls.dataset.playing = 'true';
}

async function showScene(index, automatic = false) {
  const currentRequest = ++request;
  stopTimer();
  if (index === active) {
    scheduleNext();
    return;
  }

  const slide = slides[index];
  const template = slide.querySelector('template');
  if (!slide.querySelector('picture')) slide.append(template.content.cloneNode(true));
  const image = slide.querySelector('img');
  try {
    await image.decode();
  } catch {
    if (currentRequest !== request) return;
    slide.querySelector('picture')?.remove();
    scheduleNext(index);
    return;
  }
  if (currentRequest !== request) return;
  if (automatic && !canPlay()) return;

  const outgoing = slides[active];
  slides.forEach(element => element.classList.remove('is-outgoing', 'is-entering'));
  if (!motionPreference.matches) {
    outgoing.classList.add('is-outgoing');
    slide.classList.add('is-entering');
  }
  outgoing.classList.remove('is-active');
  slide.classList.add('is-active');
  active = index;
  steps.forEach((step, stepIndex) => step.setAttribute('aria-pressed', String(stepIndex === active)));
  scheduleNext();
}

function updatePlayback() {
  pauseButton.hidden = motionPreference.matches;
  pauseButton.dataset.paused = String(paused);
  pauseButton.setAttribute('aria-label', paused ? 'Продолжить смену кадров' : 'Приостановить смену кадров');
  scheduleNext();
}

function configureReveal() {
  revealObserver?.disconnect();
  body.classList.remove('cinema-reveal-ready');
  if (motionPreference.matches || !('IntersectionObserver' in window)) return;

  revealObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  }, {threshold: .08, rootMargin: '0px 0px 24px 0px'});
  revealElements.forEach(element => {
    if (!element.classList.contains('is-visible')) revealObserver.observe(element);
  });
  body.classList.add('cinema-reveal-ready');
}

hero.querySelector('.cinema-shot').addEventListener('transitionend', event => {
  if (event.propertyName !== 'opacity' || event.target !== slides[active]) return;
  slides.forEach(slide => slide.classList.remove('is-outgoing', 'is-entering'));
});
steps.forEach((step, index) => step.addEventListener('click', () => showScene(index)));
pauseButton.addEventListener('click', () => {
  paused = !paused;
  request++;
  updatePlayback();
  requestRender();
});
controls.hidden = false;
updatePlayback();

if ('IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => {
    const visible = entry.intersectionRatio >= .2;
    if (visible === heroVisible) return;
    heroVisible = visible;
    scheduleNext();
    if (heroVisible) requestRender();
  }, {threshold: .2}).observe(hero);
}

window.addEventListener('scroll', requestRender, {passive: true});
window.addEventListener('resize', requestRender, {passive: true});
window.addEventListener('hashchange', () => {
  scheduleNext();
  requestRender();
});
window.addEventListener('pageshow', () => {
  scheduleNext();
  requestRender();
});
window.addEventListener('pagehide', () => {
  stopTimer();
  if (frame) window.cancelAnimationFrame(frame);
  frame = 0;
});
document.addEventListener('visibilitychange', () => scheduleNext());
motionPreference.addEventListener('change', () => {
  configureReveal();
  updatePlayback();
  requestRender();
});
configureReveal();
renderMotion();
