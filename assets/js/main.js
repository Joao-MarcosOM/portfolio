// URL do LinkedIn: troque só aqui. Todos os links da página (e o JSON-LD) usam esta constante.
const LINKEDIN_URL = 'https://www.linkedin.com/in/joaomarcosom/';

(() => {
  'use strict';

  const EN = window.I18N_EN || {};
  const STORAGE_KEY = 'jm-lang';
  const store = {
    get() { try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(STORAGE_KEY, v); } catch (e) { /* aba anônima: só não lembra */ } },
  };

  /* ---------- LinkedIn ---------- */
  const prettyUrl = (u) => {
    try {
      const x = new URL(u);
      return (x.hostname.replace(/^www\./, '') + decodeURIComponent(x.pathname)).replace(/\/$/, '');
    } catch (e) { return u; }
  };
  document.querySelectorAll('[data-link="linkedin"]').forEach((a) => {
    a.href = LINKEDIN_URL;
    if (a.hasAttribute('data-link-text')) a.textContent = prettyUrl(LINKEDIN_URL);
  });

  /* ---------- Dados estruturados para buscadores ---------- */
  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'João Marcos',
    url: 'https://joao-marcosom.github.io/portfolio/',
    image: 'https://joao-marcosom.github.io/portfolio/assets/img/joao.webp',
    jobTitle: 'Especialista em IA Conversacional',
    worksFor: { '@type': 'Organization', name: 'Conexxio' },
    alumniOf: [
      { '@type': 'CollegeOrUniversity', name: 'CEUB' },
      { '@type': 'EducationalOrganization', name: 'Rocketseat' },
    ],
    knowsAbout: ['IA conversacional', 'Blip', 'WhatsApp Business API', 'LLMs', 'n8n', 'Google Apps Script'],
    sameAs: [LINKEDIN_URL, 'https://github.com/Joao-MarcosOM'],
  });
  document.head.appendChild(ld);

  /* ---------- Idioma ---------- */
  const textEls = [...document.querySelectorAll('[data-i18n]')];
  const htmlEls = [...document.querySelectorAll('[data-i18n-html]')];
  const attrEls = [...document.querySelectorAll('[data-i18n-attr]')];
  const pairs = (spec) => spec.split(';').map((p) => p.split(':').map((s) => s.trim())).filter((p) => p.length === 2 && p[0]);

  // O português fica no HTML; guardo o original para poder voltar.
  const ptText = new Map(textEls.map((el) => [el, el.textContent]));
  const ptHtml = new Map(htmlEls.map((el) => [el, el.innerHTML]));
  const ptAttr = new Map(attrEls.map((el) => [el, Object.fromEntries(pairs(el.dataset.i18nAttr).map(([a]) => [a, el.getAttribute(a) || '']))]));
  const descEl = document.querySelector('meta[name="description"]');
  const pt = { title: document.title, description: descEl ? descEl.content : '' };
  const buttons = [...document.querySelectorAll('.lang [data-lang]')];

  const t = (key, fallback, en) => (en && typeof EN[key] === 'string' && EN[key].trim() ? EN[key] : fallback);

  function setLang(lang) {
    const en = lang === 'en';
    textEls.forEach((el) => { el.textContent = t(el.dataset.i18n, ptText.get(el), en); });
    htmlEls.forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml, ptHtml.get(el), en); });
    attrEls.forEach((el) => {
      pairs(el.dataset.i18nAttr).forEach(([attr, key]) => el.setAttribute(attr, t(key, ptAttr.get(el)[attr], en)));
    });
    document.documentElement.lang = en ? 'en' : 'pt-BR';
    document.title = t('meta.title', pt.title, en);
    if (descEl) descEl.content = t('meta.description', pt.description, en);
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  }

  const params = new URLSearchParams(location.search);
  const fromUrl = params.get('lang');
  const initial = fromUrl === 'en' || fromUrl === 'pt' ? fromUrl : (store.get() === 'en' ? 'en' : 'pt');
  if (initial === 'en') setLang('en');

  buttons.forEach((b) => b.addEventListener('click', () => {
    const lang = b.dataset.lang;
    setLang(lang);
    store.set(lang);
    try {
      const url = new URL(location.href);
      if (lang === 'en') url.searchParams.set('lang', 'en'); else url.searchParams.delete('lang');
      history.replaceState(null, '', url);
    } catch (e) { /* sem history: segue sem mexer na URL */ }
  }));

  /* ---------- Imagem ampliada ---------- */
  const dlg = document.getElementById('lightbox');
  if (dlg && typeof dlg.showModal === 'function') {
    const img = dlg.querySelector('.lightbox__img');
    const cap = dlg.querySelector('.lightbox__cap');
    let opener = null;

    document.addEventListener('click', (e) => {
      const a = e.target.closest('a.shot');
      if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      opener = a;
      const thumb = a.querySelector('img');
      img.src = a.getAttribute('href');
      img.alt = thumb ? thumb.alt : '';
      cap.textContent = thumb ? thumb.alt : '';
      dlg.showModal();
    });
    dlg.querySelector('.lightbox__close').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => { if (opener) opener.focus(); });
  }
})();
