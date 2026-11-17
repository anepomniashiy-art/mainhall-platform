/* Progressive enhancement: every batch still has its own normal catalogue URL. */
(function () {
  'use strict';
  function pageNumber(url) {
    return Math.max(1, Number(url.searchParams.get('plist') || url.searchParams.get('pg') || url.searchParams.get('paged') || (url.pathname.match(/\/page\/(\d+)\/?$/) || [])[1] || 1));
  }
  function catalogPath(url) { return url.pathname.replace(/\/page\/\d+\/?$/, '/').replace(/\/$/, ''); }
  function pageURL(href, base) {
    var current = new URL(base), target = new URL(href, current);
    if (target.origin !== current.origin || catalogPath(target) !== catalogPath(current)) return null;
    if (target.searchParams.has('item') || (target.searchParams.get('view') && target.searchParams.get('view') !== 'realty')) return null;
    var number = pageNumber(target);
    if (!Number.isSafeInteger(number) || number <= pageNumber(current)) return null;
    // Old pagination may omit the selected filters. Carry the exact current query.
    current.searchParams.forEach(function (value, key) {
      if (!['plist', 'pg', 'paged', 'page_id'].includes(key)) target.searchParams.set(key, value);
    });
    target.hash = '';
    return target;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {pageNumber: pageNumber, pageURL: pageURL};
    return;
  }
  function init() {
    if (!window.fetch || !window.DOMParser || !window.AbortController) return;
    var currentURL = new URL(location.href);
    if (currentURL.searchParams.has('item')) return;
    if (currentURL.pathname.includes('style-preview')) {
      if (currentURL.searchParams.get('view') !== 'realty') return;
    } else if (!/\/(?:realty)(?:\/page\/\d+)?\/?$/.test(currentURL.pathname)) return;
    var cards = Array.from(document.querySelectorAll('.re-item[data-card]'));
    if (!cards.length || cards.some(function (card) { return card.parentElement !== cards[0].parentElement; })) return;
    var grid = cards[0].parentElement;
    if (grid.dataset.wlScrollReady) return;
    function linksIn(doc, base) {
      return Array.from(doc.querySelectorAll('a[href]')).map(function (a) {
        var url;
        try { url = pageURL(a.getAttribute('href'), base); } catch (_) { return null; }
        return url ? {node: a, url: url, page: pageNumber(url)} : null;
      }).filter(Boolean).sort(function (a, b) { return a.page - b.page; });
    }
    var links = linksIn(document, currentURL.href);
    if (!links.length) return;
    // Locate the smallest original navigation container; never hide the result grid.
    var pager = links[0].node.parentElement;
    while (pager && !links.every(function (link) { return pager.contains(link.node); })) pager = pager.parentElement;
    if (pager && pager.tagName === 'LI') pager = pager.parentElement;
    if (!pager || pager.contains(grid) || pager.querySelector('.re-item') || pager === document.body) return;
    links.forEach(function (link) { link.node.href = link.url.href; });
    var lang = (document.documentElement.lang || 'en').slice(0, 2);
    var copy = {
      ru: ['Показать ещё', 'Загружаем объекты…', 'Показано объектов: ', 'Все объекты загружены', 'Не удалось загрузить объекты. Попробуйте ещё раз.', 'Повторить'],
      en: ['Show more', 'Loading properties…', 'Properties shown: ', 'All properties loaded', 'Could not load properties. Please try again.', 'Try again'],
      de: ['Mehr anzeigen', 'Immobilien werden geladen…', 'Angezeigte Immobilien: ', 'Alle Immobilien geladen', 'Immobilien konnten nicht geladen werden. Bitte erneut versuchen.', 'Erneut versuchen'],
      pl: ['Pokaż więcej', 'Wczytujemy nieruchomości…', 'Wyświetlone nieruchomości: ', 'Wszystkie nieruchomości wczytane', 'Nie udało się wczytać nieruchomości. Spróbuj ponownie.', 'Spróbuj ponownie']
    }[lang] || ['Show more', 'Loading properties…', 'Properties shown: ', 'All properties loaded', 'Could not load properties. Please try again.', 'Try again'];
    var control = document.createElement('div');
    control.className = 'wl-catalog-load';
    var status = document.createElement('p');
    status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true');
    var button = document.createElement('button');
    button.type = 'button'; button.className = 'wl-catalog-load-button'; button.textContent = copy[0];
    control.append(status, button); pager.before(control);
    var next = links[0].url.href, loading = false, failed = false, loaded = new Set([currentURL.href]);
    var ids = new Set(cards.map(function (card) { return card.dataset.card; }));
    var observer;
    function count() { status.textContent = copy[2] + ids.size; }
    function activateImages(card) {
      card.querySelectorAll('img').forEach(function (img) {
        ['src', 'srcset', 'sizes'].forEach(function (attribute) {
          var value = img.getAttribute('data-' + attribute);
          if (value) img.setAttribute(attribute, value);
        });
        img.loading = 'lazy'; img.decoding = 'async';
        img.classList.remove('lazyload', 'lazyloading'); img.classList.add('lazyloaded');
      });
    }
    async function loadMore(manual) {
      if (loading || !next || (failed && !manual)) return;
      loading = true; failed = false; button.disabled = true; status.textContent = copy[1];
      grid.setAttribute('aria-busy', 'true'); control.classList.add('is-loading');
      var requested = next, aborter = new AbortController();
      var timeout = setTimeout(function () { aborter.abort(); }, 20000);
      try {
        if (loaded.has(requested)) throw new Error('Repeated page');
        var response = await fetch(requested, {credentials: 'same-origin', signal: aborter.signal});
        if (!response.ok || !(response.headers.get('content-type') || '').includes('text/html')) throw new Error('Invalid catalogue response');
        var doc = new DOMParser().parseFromString(await response.text(), 'text/html');
        var batch = Array.from(doc.querySelectorAll('.re-item[data-card]'));
        var fresh = batch.filter(function (card) { return !ids.has(card.dataset.card); });
        if (!batch.length || !fresh.length) throw new Error('Empty or repeated result page');
        var fragment = document.createDocumentFragment(), added = [];
        fresh.forEach(function (card) {
          if (ids.has(card.dataset.card)) return;
          var node = document.importNode(card, true);
          node.querySelectorAll('script').forEach(function (script) { script.remove(); });
          activateImages(node); ids.add(node.dataset.card); fragment.appendChild(node); added.push(node);
        });
        grid.appendChild(fragment); loaded.add(requested);
        var following = linksIn(doc, requested).filter(function (link) { return !loaded.has(link.url.href); });
        next = following.length ? following[0].url.href : '';
        pager.classList.add('wl-page-fallback'); count(); button.textContent = copy[0];
        // Existing delegated handlers keep receiving clicks; an explicit hook is also
        // available to the theme for any widget that needs per-card initialization.
        document.dispatchEvent(new CustomEvent('wellton:cards-added', {detail: {cards: added}}));
        if (!next) {
          status.textContent = copy[2] + ids.size + ' · ' + copy[3];
          button.hidden = true; if (observer) observer.disconnect();
        }
      } catch (_) {
        failed = true; status.textContent = copy[4]; button.textContent = copy[5];
        pager.classList.remove('wl-page-fallback');
      } finally {
        clearTimeout(timeout); loading = false; button.disabled = false;
        grid.removeAttribute('aria-busy'); control.classList.remove('is-loading');
        if (next && !failed && observer) { observer.unobserve(control); observer.observe(control); }
      }
    }
    button.addEventListener('click', function () { loadMore(true); });
    grid.dataset.wlScrollReady = 'true'; pager.classList.add('wl-page-fallback'); count();
    if ('IntersectionObserver' in window && !(navigator.connection && navigator.connection.saveData)) {
      observer = new IntersectionObserver(function (entries) {
        if (entries.some(function (entry) { return entry.isIntersecting; })) loadMore(false);
      }, {rootMargin: '0px 0px 400px 0px'});
      observer.observe(control);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
