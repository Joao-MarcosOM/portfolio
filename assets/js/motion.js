/* Movimento do portfólio. Inspirado no proposta-kit: só transform, opacity e
   clip-path, nada que force layout. Sem JS ou com movimento reduzido, a
   página aparece inteira e parada. */
(() => {
  'use strict';
  window.__motionOk = true;

  const doc = document;
  const parado = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const temIO = 'IntersectionObserver' in window;
  const limitar = (v) => Math.min(1, Math.max(0, v));
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));

  /* Quebra o texto em <span> por palavra, devolvendo os espaços como texto:
     o textContent continua idêntico e o leitor de tela lê a frase inteira. */
  const quebrar = (el, classe, mascara) => {
    const partes = el.textContent.split(/(\s+)/);
    el.textContent = '';
    const spans = [];
    for (const parte of partes) {
      if (!parte) continue;
      if (/^\s+$/.test(parte)) { el.append(parte); continue; }
      const s = doc.createElement('span');
      s.className = classe;
      s.style.setProperty('--i', spans.length);
      s.textContent = parte;
      if (mascara) {
        const m = doc.createElement('span');
        m.className = 'wm';
        m.append(s);
        el.append(m);
      } else el.append(s);
      spans.push(s);
    }
    return spans;
  };

  const revelar = (el) => el.classList.add('is-in');
  const alvos = '[data-reveal],[data-revela],[data-palavras]';

  /* ---------- Parado: tudo visível, só o que é função continua ---------- */
  if (parado || !temIO) {
    doc.querySelectorAll(alvos).forEach(revelar);
    const tl = doc.querySelector('[data-timeline]');
    if (tl) { tl.style.setProperty('--prog', 1); [...tl.children].forEach((li) => li.classList.add('lit')); }
    return;
  }

  /* ---------- Palavras e texto que acende ---------- */
  let acendiveis = [];
  const preparar = () => {
    doc.querySelectorAll('[data-palavras]').forEach((el) => { quebrar(el, 'w', true); el.classList.add('split'); });
    acendiveis = [...doc.querySelectorAll('[data-acende]')].map((el) => ({ el, palavras: quebrar(el, 'aw', false) }));
  };
  preparar();

  // Tags da stack entram uma a uma.
  doc.querySelectorAll('.stack__group .tags').forEach((ul) => [...ul.children].forEach((li, i) => li.style.setProperty('--i', i)));

  /* ---------- Entrada por rolagem ---------- */
  const io = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      revelar(e.target);
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  doc.querySelectorAll(alvos).forEach((el) => io.observe(el));

  /* ---------- Contadores (o número final já está no HTML) ---------- */
  const contar = (el, alvo, dur = 1300) => new Promise((fim) => {
    const final = el.textContent;
    const sufixo = final.replace(/[\d.,\s]/g, '');
    const t0 = performance.now();
    const passo = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      if (p < 1) { el.textContent = Math.round(alvo * e) + sufixo; requestAnimationFrame(passo); } else { el.textContent = final; fim(); }
    };
    requestAnimationFrame(passo);
  });
  const ioCount = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      ioCount.unobserve(e.target);
      contar(e.target, Number(e.target.dataset.count));
    }
  }, { threshold: 0.6 });
  doc.querySelectorAll('[data-count]').forEach((el) => ioCount.observe(el));

  /* ---------- Cartão do hero: o diagnóstico rodando ao vivo ----------
     O cliente "digita", a mensagem chega, o JSON sai caractere por caractere
     como resposta de LLM e a métrica conta até 86%. Repete enquanto está na
     tela. O texto todo continua no DOM o tempo inteiro. */
  doc.querySelectorAll('[data-pipeline]').forEach((fig) => {
    const etapas = [...fig.querySelectorAll('.pipe')];
    const digitando = fig.querySelector('.typing');
    const balao = fig.querySelector('.bubble');
    const codigo = fig.querySelector('[data-stream]');
    const numero = fig.querySelector('.pipe--metric strong');
    if (etapas.length < 3 || !digitando || !balao || !codigo || !numero) return;

    const chars = [];
    const andar = (no) => {
      [...no.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = doc.createDocumentFragment();
          for (const ch of n.textContent) {
            if (ch === '\n') { frag.append(ch); continue; }
            const s = doc.createElement('span');
            s.className = 'c';
            s.textContent = ch;
            frag.append(s);
            chars.push(s);
          }
          n.replaceWith(frag);
        } else andar(n);
      });
    };
    andar(codigo);

    const finalNum = numero.textContent;
    const alvo = parseInt(finalNum, 10) || 0;
    const sufixo = finalNum.replace(/[\d.,\s]/g, '');
    fig.dataset.anim = '';

    const zerar = () => {
      etapas.forEach((s) => s.classList.remove('on'));
      digitando.classList.remove('on');
      balao.classList.remove('on');
      chars.forEach((c) => c.classList.remove('on', 'cur'));
      numero.textContent = '0' + sufixo;
      numero.classList.remove('pop');
    };
    zerar();

    let visivel = false;
    let rodando = false;
    const rodar = async () => {
      rodando = true;
      while (visivel && !doc.hidden) {
        zerar();
        await espera(350);
        etapas[0].classList.add('on');
        digitando.classList.add('on');
        await espera(1150);
        digitando.classList.remove('on');
        balao.classList.add('on');
        await espera(650);
        etapas[1].classList.add('on');
        await espera(250);
        for (let i = 0; i < chars.length; i++) {
          if (i) chars[i - 1].classList.remove('cur');
          chars[i].classList.add('on', 'cur');
          if (chars[i].textContent.trim()) await espera(17);
        }
        await espera(250);
        chars[chars.length - 1].classList.remove('cur');
        etapas[2].classList.add('on');
        numero.textContent = '0' + sufixo;
        await contar(numero, alvo, 1100);
        numero.textContent = finalNum;
        numero.classList.add('pop');
        await espera(4800);
        fig.classList.add('is-fading');
        await espera(450);
        fig.classList.remove('is-fading');
      }
      // Saiu da tela no meio: deixa o cartão completo e parado.
      etapas.forEach((s) => s.classList.add('on'));
      balao.classList.add('on');
      chars.forEach((c) => { c.classList.add('on'); c.classList.remove('cur'); });
      digitando.classList.remove('on');
      numero.textContent = finalNum;
      rodando = false;
    };
    new IntersectionObserver(([e]) => {
      visivel = e.isIntersecting;
      if (visivel && !rodando) rodar();
    }, { threshold: 0.3 }).observe(fig);
    doc.addEventListener('visibilitychange', () => { if (!doc.hidden && visivel && !rodando) rodar(); });
  });

  /* ---------- Rolagem: progresso, topo, texto que acende, linha do tempo ---------- */
  const barra = doc.querySelector('.progress span');
  const topo = doc.querySelector('.topbar');
  const tl = doc.querySelector('[data-timeline]');
  const marcos = tl ? [...tl.children] : [];
  let pendente = false;
  const quadro = () => {
    pendente = false;
    const h = innerHeight;
    const max = doc.documentElement.scrollHeight - h;
    if (barra) barra.style.transform = `scaleX(${max > 0 ? limitar(scrollY / max).toFixed(4) : 0})`;
    if (topo) topo.classList.toggle('is-scrolled', scrollY > 8);

    const fim = scrollY + h >= doc.documentElement.scrollHeight - 4;
    for (const { el, palavras } of acendiveis) {
      const r = el.getBoundingClientRect();
      const prog = fim && r.top < h ? 1 : limitar((h * 0.88 - r.top) / (r.height + h * 0.3));
      const acesas = Math.ceil(prog * palavras.length);
      palavras.forEach((p, i) => p.classList.toggle('on', i < acesas));
    }

    if (tl) {
      const r = tl.getBoundingClientRect();
      const linha = h * 0.62;
      tl.style.setProperty('--prog', limitar((linha - r.top) / r.height).toFixed(3));
      marcos.forEach((li) => li.classList.toggle('lit', li.getBoundingClientRect().top + 10 < linha || fim));
    }
  };
  addEventListener('scroll', () => {
    if (pendente) return;
    pendente = true;
    requestAnimationFrame(quadro);
  }, { passive: true });
  addEventListener('resize', quadro, { passive: true });
  quadro();

  /* ---------- Troca de idioma: re-quebra o que o main.js reescreveu ---------- */
  doc.addEventListener('langchange', () => { preparar(); quadro(); });

  /* ---------- Inclinação e brilho seguem o ponteiro (só com mouse) ---------- */
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  doc.querySelectorAll('[data-tilt]').forEach((el) => {
    el.addEventListener('pointermove', (ev) => {
      const r = el.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width - 0.5;
      const y = (ev.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(1000px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  doc.querySelectorAll('[data-glow]').forEach((el) => {
    el.addEventListener('pointermove', (ev) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--gx', `${ev.clientX - r.left}px`);
      el.style.setProperty('--gy', `${ev.clientY - r.top}px`);
    });
  });
})();
