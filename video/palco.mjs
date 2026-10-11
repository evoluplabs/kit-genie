// "Palco" do vídeo (roda dentro do navegador). Substitui o overlay.mjs antigo.
//
// Estrutura: a página do palco tem 1080×1920 px e contém o app num iframe de 405×720 px (tela de
// celular), ampliado 2,667× (escala S). Em cima do iframe ficam, em duas camadas:
//   • camada "no app" (#camfx): anel de destaque, dedo e etiquetas — usam coordenadas do app e
//     acompanham a câmera;
//   • camada "no palco" (#fx): legenda, título de capítulo, cartões e varrida de transição.
// A "câmera" é um zoom + deslocamento do iframe (função cam). Sem escurecer nada.
//
// A mesma função roda no palco e dentro do iframe; cada um instala só o que lhe cabe.

export function installPalco() {
  const W = 1080, H = 1920, AW = 405, AH = 720, S = W / AW;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  // ───────────── dentro do app (iframe): rolagem, contagem e medidas ─────────────
  if (window.top !== window) {
    // Só para gravar: o desfoque do fundo dos modais derruba a captura com a câmera em movimento,
    // e o fundo escuro dos modais é suavizado (o vídeo precisa de tela clara). O produto não muda.
    document.addEventListener("DOMContentLoaded", () => {
      const st = document.createElement("style");
      st.textContent =
        "*{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}" +
        ".bg-black\\/50,.bg-black\\/40{background-color:rgba(40,20,50,.2)!important}";
      document.head.appendChild(st);
    });
    window.__h = {
      rect(el) {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      },
      // rola (janela ou a caixa rolável mais próxima, como um modal) até o topo de `el` ficar em y
      async reveal(el, y, ms) {
        let sc = null;
        for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) {
          const st = getComputedStyle(e);
          if (/(auto|scroll)/.test(st.overflowY) && e.scrollHeight > e.clientHeight + 2) { sc = e; break; }
        }
        const y0 = sc ? sc.scrollTop : window.scrollY;
        const alvo = y0 + (el.getBoundingClientRect().top - y);
        const t0 = performance.now();
        for (;;) {
          const k = Math.min(1, (performance.now() - t0) / ms);
          const v = y0 + (alvo - y0) * ease(k);
          if (sc) sc.scrollTop = v; else window.scrollTo(0, v);
          if (k >= 1) break;
          await wait(16);
        }
      },
      async scrollBy(dy, ms) {
        const y0 = window.scrollY, t0 = performance.now();
        for (;;) {
          const k = Math.min(1, (performance.now() - t0) / ms);
          window.scrollTo(0, y0 + dy * ease(k));
          if (k >= 1) break;
          await wait(16);
        }
      },
      // número que sobe de 0 até `to` (moeda ou inteiro)
      async count(el, to, ms, money) {
        const t0 = performance.now();
        const show = (v) => {
          el.textContent = money
            ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/ /g, " ")
            : String(Math.round(v));
        };
        for (;;) {
          const k = Math.min(1, (performance.now() - t0) / ms);
          show(to * easeOut(k));
          if (k >= 1) break;
          await wait(16);
        }
        show(to);
      },
    };
    return;
  }

  // ───────────── no palco (página de cima) ─────────────
  const PINK = "#ec4899", PINK_D = "#e11d74";
  const css = `
  html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:#fdf2f8;font-family:"Plus Jakarta Sans",system-ui,sans-serif}
  #cam{position:absolute;left:0;top:0;width:${AW}px;height:${AH}px;transform-origin:0 0;background:#fff}
  #cam iframe{position:absolute;inset:0;width:${AW}px;height:${AH}px;border:0;background:#fff}
  #camfx{position:absolute;inset:0;pointer-events:none;--u:${1 / S}px}
  #fx{position:absolute;left:0;top:0;width:${W}px;height:${H}px;pointer-events:none}
  #cardhost{position:absolute;left:0;top:0;width:${AW}px;height:${AH}px;transform:scale(${S});transform-origin:0 0;pointer-events:none}
  .card{position:absolute;inset:0;opacity:0;transition:opacity .25s}.card.on{opacity:1}

  .cap{position:absolute;left:50%;width:max-content;max-width:900px;padding:18px 34px 20px;border-radius:44px;
    background:rgba(255,255,255,.92);color:#2a1030;font-weight:800;font-size:46px;line-height:1.18;text-align:center;
    text-wrap:balance;box-shadow:0 14px 44px rgba(190,24,93,.22),0 2px 6px rgba(0,0,0,.08);border:2px solid rgba(236,72,153,.25);
    opacity:0;transform:translateX(-50%) translateY(var(--dy,24px)) scale(.9);transition:opacity .2s,transform .28s cubic-bezier(.2,1.5,.4,1)}
  .cap.on{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}
  .cap.big{font-size:72px;padding:26px 46px 30px;max-width:960px;border-radius:56px}
  .cap b{color:${PINK_D};font-weight:900}
  .cap.top{top:250px;--dy:-24px}
  .cap.bot{bottom:380px}
  .cap.mid{top:50%;margin-top:-90px}

  .chap{position:absolute;left:48px;top:250px;padding:12px 26px;border-radius:999px;background:${PINK};color:#fff;font-weight:800;
    font-size:36px;letter-spacing:.01em;box-shadow:0 10px 30px rgba(190,24,93,.35);opacity:0;transform:translateX(-30px) scale(.95);
    transition:opacity .22s,transform .3s cubic-bezier(.2,1.4,.4,1)}
  .chap.on{opacity:1;transform:none}

  .ring{position:absolute;border-radius:calc(var(--u)*30);border:calc(var(--u)*7) solid ${PINK};box-shadow:0 0 0 calc(var(--u)*12) rgba(236,72,153,.16),0 0 calc(var(--u)*50) rgba(236,72,153,.35);
    opacity:0;transition:opacity .22s,transform .3s cubic-bezier(.2,1.4,.4,1);transform:scale(1.06)}
  .ring.on{opacity:1;transform:scale(1);animation:rp 1s ease-in-out infinite}
  @keyframes rp{50%{box-shadow:0 0 0 calc(var(--u)*20) rgba(236,72,153,.08),0 0 calc(var(--u)*60) rgba(236,72,153,.45)}}

  .tag{position:absolute;padding:calc(var(--u)*10) calc(var(--u)*22);border-radius:999px;background:${PINK};color:#fff;font-weight:900;
    font-size:calc(var(--u)*42);white-space:nowrap;box-shadow:0 calc(var(--u)*10) calc(var(--u)*30) rgba(190,24,93,.4);
    transform:translate(-50%,-50%) scale(.4);opacity:0;transition:opacity .15s,transform .35s cubic-bezier(.2,1.8,.4,1)}
  .tag.on{opacity:1;transform:translate(-50%,-50%) scale(1)}
  .tag.green{background:#10b981;box-shadow:0 calc(var(--u)*10) calc(var(--u)*30) rgba(16,185,129,.4)}

  .finger{position:absolute;left:0;top:0;width:calc(var(--u)*78);height:calc(var(--u)*78);margin:calc(var(--u)*-39) 0 0 calc(var(--u)*-39);border-radius:50%;
    background:rgba(255,255,255,.96);border:calc(var(--u)*7) solid ${PINK};box-shadow:0 calc(var(--u)*10) calc(var(--u)*30) rgba(0,0,0,.35);
    opacity:0;transition:transform .36s cubic-bezier(.3,.8,.3,1),opacity .2s,scale .12s}
  .finger.down{scale:.76}
  .ripple{position:absolute;width:calc(var(--u)*78);height:calc(var(--u)*78);margin:calc(var(--u)*-39) 0 0 calc(var(--u)*-39);border-radius:50%;
    border:calc(var(--u)*7) solid ${PINK};animation:ovr .55s ease-out forwards}
  @keyframes ovr{from{transform:scale(.6);opacity:.95}to{transform:scale(2.6);opacity:0}}

  .wipe{position:absolute;top:-10%;bottom:-10%;left:-60%;width:220%;transform:translateX(-110%) skewX(-14deg);
    background:linear-gradient(100deg,#f9a8d4 0%,${PINK} 38%,#be185d 100%)}
  `;

  const cam = { z: 1, cx: AW / 2, cy: AH / 2, fy: 0.5 }; // fy: onde (na altura do palco) fica o ponto focal
  let camEl, camfx, fx, host, finger = null, sumir = 0, wipeEl;
  let anim = 0;
  let T = { tx: 0, ty: 0, k: S }; // última transformação aplicada (para converter coordenadas)

  const apply = () => {
    const k = S * cam.z;
    let tx = W / 2 - k * cam.cx;
    let ty = H * cam.fy - k * cam.cy;
    tx = Math.min(0, Math.max(W - k * AW, tx));
    ty = Math.min(0, Math.max(H - k * AH, ty));
    T = { tx, ty, k };
    camEl.style.transform = `translate(${tx}px,${ty}px) scale(${k})`;
    camfx.style.setProperty("--u", 1 / k + "px");
  };

  const build = () => {
    if (camEl) return;
    const st = document.createElement("style");
    st.textContent = css;
    document.head.appendChild(st);
    camEl = document.createElement("div");
    camEl.id = "cam";
    const ifr = document.createElement("iframe");
    ifr.id = "app";
    ifr.src = new URLSearchParams(location.search).get("p") || "/app";
    camEl.appendChild(ifr);
    camfx = document.createElement("div");
    camfx.id = "camfx";
    camEl.appendChild(camfx);
    document.body.appendChild(camEl);
    host = document.createElement("div");
    host.id = "cardhost";
    document.body.appendChild(host);
    fx = document.createElement("div");
    fx.id = "fx";
    document.body.appendChild(fx);
    wipeEl = document.createElement("div");
    wipeEl.className = "wipe";
    fx.appendChild(wipeEl);
    apply();
  };
  document.addEventListener("DOMContentLoaded", build);

  const fmt = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\[\[(.+?)\]\]/g, "<b>$1</b>");
  const killLater = (el, ms) => setTimeout(() => el.remove(), ms);

  window.__v = {
    // ── câmera: z = zoom (1 = tela inteira), (cx,cy) = ponto do app no centro, fy = altura do foco no palco
    cam(z, cx, cy, ms = 800, fy = 0.5) {
      build();
      cancelAnimationFrame(anim);
      const a = { ...cam }, b = { z, cx, cy, fy };
      const t0 = performance.now();
      return new Promise((res) => {
        const step = () => {
          const k = Math.min(1, (performance.now() - t0) / Math.max(1, ms));
          const e = ease(k);
          cam.z = a.z + (b.z - a.z) * e;
          cam.cx = a.cx + (b.cx - a.cx) * e;
          cam.cy = a.cy + (b.cy - a.cy) * e;
          cam.fy = a.fy + (b.fy - a.fy) * e;
          apply();
          if (k < 1) anim = requestAnimationFrame(step); else res();
        };
        step();
      });
    },
    camState: () => ({ ...cam }),
    // converte uma altura do app (px CSS) em altura no palco (px do vídeo), com a câmera atual
    toStageY(y) { return T.ty + T.k * y; },

    // ── legenda curta, clara, que some sozinha; pos: "top" | "bot" | "mid"
    cap(text, { pos = "bot", hold = 0, big = false } = {}) {
      build();
      fx.querySelectorAll(".cap").forEach((o) => { o.classList.remove("on"); killLater(o, 260); });
      if (!text) return;
      const d = document.createElement("div");
      d.className = `cap ${pos} ${big ? "big" : ""}`;
      d.innerHTML = fmt(text);
      fx.appendChild(d);
      requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add("on")));
      const ms = hold || Math.min(1800, 700 + 34 * String(text).length);
      (window.__capLog = window.__capLog || []).push(ms + 260); // 260 ms de entrada/saída
      setTimeout(() => { d.classList.remove("on"); killLater(d, 300); }, ms);
    },
    capOff() { this.cap(""); },
    capTotalMs() { return (window.__capLog || []).reduce((a, b) => a + b, 0); },

    // ── título de capítulo (canto superior esquerdo)
    chapter(text, ms = 1500) {
      build();
      const d = document.createElement("div");
      d.className = "chap";
      d.textContent = text;
      fx.appendChild(d);
      requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add("on")));
      setTimeout(() => { d.classList.remove("on"); killLater(d, 320); }, ms);
    },

    // ── anel de destaque (sem escurecer) em volta de um retângulo do app
    ring(r, pad = 5) {
      build();
      let e = camfx.querySelector(".ring");
      if (!e) { e = document.createElement("div"); e.className = "ring"; camfx.appendChild(e); }
      e.style.left = r.x - pad + "px"; e.style.top = r.y - pad + "px";
      e.style.width = r.w + pad * 2 + "px"; e.style.height = r.h + pad * 2 + "px";
      requestAnimationFrame(() => e.classList.add("on"));
    },
    ringOff() { const e = camfx && camfx.querySelector(".ring"); if (e) e.classList.remove("on"); },

    // ── etiqueta que "pula" ao lado de um ponto do app
    tag(text, x, y, ms = 1800, green = false) {
      build();
      const d = document.createElement("div");
      d.className = "tag" + (green ? " green" : "");
      d.textContent = text;
      d.style.left = x + "px"; d.style.top = y + "px";
      camfx.appendChild(d);
      requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add("on")));
      setTimeout(() => { d.classList.remove("on"); killLater(d, 300); }, ms);
    },

    // ── dedo: anda até (x,y) do app e toca
    async tap(x, y) {
      build();
      if (!finger) {
        finger = document.createElement("div");
        finger.className = "finger";
        finger.style.transform = `translate(${x}px,${y + 40}px)`;
        camfx.appendChild(finger);
        await wait(30);
      }
      finger.style.opacity = "1";
      finger.style.transform = `translate(${x}px,${y}px)`;
      await wait(380);
      finger.classList.add("down");
      const rp = document.createElement("div");
      rp.className = "ripple";
      rp.style.left = x + "px"; rp.style.top = y + "px";
      camfx.appendChild(rp);
      killLater(rp, 600);
      await wait(100);
      finger.classList.remove("down");
      clearTimeout(sumir);
      sumir = setTimeout(() => { if (finger) finger.style.opacity = "0"; }, 700);
    },

    // ── cartão de tela cheia (HTML em coordenadas 405×720)
    card(html) {
      build();
      const c = document.createElement("div");
      c.className = "card";
      c.innerHTML = html;
      host.appendChild(c);
      requestAnimationFrame(() => requestAnimationFrame(() => c.classList.add("on")));
    },
    cardOff() {
      host.querySelectorAll(".card").forEach((c) => { c.classList.remove("on"); killLater(c, 300); });
    },

    // ── varrida rosa de transição: cobrir (fecha a cena) e revelar (abre a cena)
    cover(ms = 300) {
      build();
      return wipeEl.animate(
        [{ transform: "translateX(-110%) skewX(-14deg)" }, { transform: "translateX(0%) skewX(-14deg)" }],
        { duration: ms, easing: "cubic-bezier(.6,0,.9,.5)", fill: "forwards" },
      ).finished;
    },
    reveal(ms = 380) {
      build();
      return wipeEl.animate(
        [{ transform: "translateX(0%) skewX(-14deg)" }, { transform: "translateX(110%) skewX(-14deg)" }],
        { duration: ms, easing: "cubic-bezier(.1,.6,.3,1)", fill: "forwards" },
      ).finished;
    },
    startCovered() { build(); wipeEl.style.transform = "translateX(0%) skewX(-14deg)"; },
  };
}
