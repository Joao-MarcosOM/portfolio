/* Fundo vivo: manchas de cor fluindo, em WebGL, que seguem o ponteiro.
   Adaptado do fundo-vivo do proposta-kit. As cores vêm das variáveis
   --vivo-* do CSS do anfitrião (o hero ou uma seção [data-vivo]), então
   acompanham claro e escuro. Pausa fora da tela, desenha um quadro só com
   movimento reduzido e, sem WebGL, fica o gradiente estático do CSS. */
(() => {
  'use strict';

  const parado = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const escuro = matchMedia('(prefers-color-scheme: dark)');

  const animar = (tela) => {
    const host = tela.closest('[data-vivo]') || tela.closest('.hero');
    if (!host) return;
    let gl = null;
    try { gl = tela.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' }); } catch (e) { gl = null; }
    if (!gl) { tela.remove(); return; }

    // Lê a cor computada de uma variável. color-mix() vira color(srgb r g b)
    // em 0 a 1; cor simples vira rgb() em 0 a 255.
    const sonda = document.createElement('span');
    sonda.style.display = 'none';
    host.append(sonda);
    const cor = (nome) => {
      sonda.style.color = `var(${nome})`;
      const c = getComputedStyle(sonda).color;
      const n = (c.match(/[\d.]+/g) || []).map(Number);
      return c.startsWith('color(') ? n.slice(0, 3) : n.slice(0, 3).map((v) => v / 255);
    };

    const vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    const fs = `precision mediump float;
uniform vec2 r;uniform float t;uniform vec2 m;uniform vec3 bg,c1,c2,c3;
float b(vec2 p,vec2 c,float s){vec2 d=p-c;return exp(-dot(d,d)/s);}
void main(){
  vec2 uv=gl_FragCoord.xy/r;float a=r.x/r.y;vec2 p=vec2(uv.x*a,uv.y);
  p+=.05*vec2(sin(p.y*3.5+t*.6),cos(p.x*3.5+t*.5));
  vec3 col=bg;
  col=mix(col,c1,b(p,vec2(a*(.78+.12*sin(t*.23)),.70+.12*cos(t*.31)),.12));
  col=mix(col,c2,.9*b(p,vec2(a*(.18+.14*cos(t*.19)),.22+.14*sin(t*.27)),.10));
  col=mix(col,c1,.55*b(p,vec2(a*(.48+.28*cos(t*.17)),.95+.08*sin(t*.29)),.08));
  col=mix(col,c3,.8*b(p,vec2(m.x*a,m.y),.03));
  float g=fract(sin(dot(gl_FragCoord.xy+fract(t)*91.,vec2(12.9898,78.233)))*43758.5453);
  col+=(g-.5)*.035;
  gl_FragColor=vec4(col,1.);
}`;
    const sombra = (tipo, src) => {
      const s = gl.createShader(tipo);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, sombra(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, sombra(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { tela.remove(); return; }
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n) => gl.getUniformLocation(prog, n);
    const cores = () => {
      gl.uniform3fv(U('bg'), cor('--vivo-bg'));
      gl.uniform3fv(U('c1'), cor('--vivo-1'));
      gl.uniform3fv(U('c2'), cor('--vivo-2'));
      gl.uniform3fv(U('c3'), cor('--vivo-3'));
    };

    // Resolução reduzida: são manchas desfocadas, não precisam de cada pixel.
    const escala = Math.min(devicePixelRatio || 1, 1.5) * 0.6;
    const ajustar = () => {
      tela.width = Math.max(1, Math.round(host.clientWidth * escala));
      tela.height = Math.max(1, Math.round(host.clientHeight * escala));
      gl.viewport(0, 0, tela.width, tela.height);
    };
    ajustar();
    cores();
    host.classList.add('vivo-on');

    let mx = 0.7, my = 0.6, tx = mx, ty = my, livre = true;
    const seguir = (ev) => {
      const rr = host.getBoundingClientRect();
      tx = (ev.clientX - rr.left) / rr.width;
      ty = 1 - (ev.clientY - rr.top) / rr.height;
      livre = false;
    };
    host.addEventListener('pointermove', seguir, { passive: true });
    host.addEventListener('pointerdown', seguir, { passive: true });
    host.addEventListener('pointerleave', () => { livre = true; }, { passive: true });

    const t0 = performance.now();
    const pintar = (agora) => {
      const t = (agora - t0) / 1000;
      if (livre) {
        tx = 0.66 + 0.22 * Math.sin(t * 0.37);
        ty = 0.55 + 0.18 * Math.cos(t * 0.29);
      }
      mx += (tx - mx) * 0.06;
      my += (ty - my) * 0.06;
      gl.uniform2f(U('r'), tela.width, tela.height);
      gl.uniform1f(U('t'), t);
      gl.uniform2f(U('m'), mx, my);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    if ('ResizeObserver' in window) new ResizeObserver(() => { ajustar(); if (parado) pintar(t0 + 4000); }).observe(host);
    escuro.addEventListener('change', () => { cores(); if (parado) pintar(t0 + 4000); });

    if (parado) { pintar(t0 + 4000); return; }

    let visivel = true;
    let pedido = 0;
    const laco = (agora) => {
      pintar(agora);
      pedido = visivel && !document.hidden ? requestAnimationFrame(laco) : 0;
    };
    new IntersectionObserver(([e]) => {
      visivel = e.isIntersecting;
      if (visivel && !pedido) pedido = requestAnimationFrame(laco);
    }).observe(host);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && visivel && !pedido) pedido = requestAnimationFrame(laco);
    });
    pedido = requestAnimationFrame(laco);
  };

  document.querySelectorAll('canvas.vivo').forEach(animar);
})();
