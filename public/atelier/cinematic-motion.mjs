/** Native scrolling stays in control; motion is a small progressive enhancement. */
const hero = document.querySelector('#cinema-hero');
const body = document.body;
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const revealElements = [...document.querySelectorAll('[data-cinema-reveal]')]
  .filter(element => !element.closest('#cinema-hero'));
let frame = 0;
let heroVisible = true;
let heroObserver = null;
let revealObserver = null;

const homeRoute = () => !/^#(?:project|unit)\//.test(window.location.hash);

function resetHeroMotion() {
  hero?.style.setProperty('--hero-image-y', '0px');
  hero?.style.setProperty('--hero-copy-y', '0px');
}

function renderMotion() {
  frame = 0;
  const atHome = homeRoute();
  body.classList.toggle('cinematic-home', atHome && !!hero);
  body.classList.toggle('cinematic-scrolled', !atHome || window.scrollY > 70);
  if (!hero || !atHome || motionPreference.matches) {
    resetHeroMotion();
    return;
  }
  if (!heroVisible) return;
  const bounds = hero.getBoundingClientRect();
  if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) return;
  const distance = Math.max(0, -bounds.top);
  hero.style.setProperty('--hero-image-y', `${Math.min(75, distance * 0.15).toFixed(2)}px`);
  hero.style.setProperty('--hero-copy-y', `${Math.min(20, distance * 0.04).toFixed(2)}px`);
}

function requestRender() {
  if (!frame) frame = window.requestAnimationFrame(renderMotion);
}

function configureReveal() {
  revealObserver?.disconnect();
  revealObserver = null;
  body.classList.remove('cinema-reveal-ready');
  if (motionPreference.matches || !('IntersectionObserver' in window)) {
    revealElements.forEach(element => element.classList.add('is-visible'));
    return;
  }
  try {
    revealObserver = new window.IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        revealObserver?.unobserve(entry.target);
      }
    }, {threshold: 0.08, rootMargin: '0px 0px 24px 0px'});
    for (const element of revealElements) {
      if (!element.classList.contains('is-visible')) revealObserver.observe(element);
    }
    // Added only after construction and observation succeeded. CSS is visible by default.
    body.classList.add('cinema-reveal-ready');
  } catch {
    revealObserver?.disconnect();
    revealObserver = null;
    body.classList.remove('cinema-reveal-ready');
    revealElements.forEach(element => element.classList.add('is-visible'));
  }
}

if (hero && 'IntersectionObserver' in window) {
  try {
    heroObserver = new window.IntersectionObserver(([entry]) => {
      heroVisible = !!entry?.isIntersecting;
      if (heroVisible) requestRender();
    }, {threshold: 0});
    heroObserver.observe(hero);
  } catch {
    heroObserver = null;
  }
}

function preferenceChanged() {
  if (motionPreference.matches) resetHeroMotion();
  configureReveal();
  requestRender();
}

window.addEventListener('scroll', requestRender, {passive: true});
window.addEventListener('resize', requestRender, {passive: true});
window.addEventListener('hashchange', requestRender);
window.addEventListener('pageshow', requestRender);
window.addEventListener('pagehide', () => {
  if (frame) window.cancelAnimationFrame(frame);
  frame = 0;
});
if (typeof motionPreference.addEventListener === 'function') {
  motionPreference.addEventListener('change', preferenceChanged);
} else if (typeof motionPreference.addListener === 'function') {
  motionPreference.addListener(preferenceChanged);
}

configureReveal();
// Set the correct header state before the first scroll or restored page frame.
renderMotion();
