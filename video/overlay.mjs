// Camada visual injetada na página durante a gravação (roda dentro do navegador).
// Tudo que prende o olhar mora aqui: legenda, toque do dedo, destaque, contador,
// barra de progresso e cartões de tela cheia. Medidas em px CSS de uma tela 405×720
// (que vira 1080×1920 no vídeo, escala 2,667).
// Faixas livres do Reels: topo ≤ 82px e base ≥ 593px; a legenda fica logo acima da base.

export function installOverlay() {
  const PINK = "#ec4899";
  const css = `
  #ov{position:fixed;inset:0;z-index:2147483000;pointer-events:none;font-family:"Plus Jakarta Sans",system-ui,sans-serif}
  #ov *{box-sizing:border-box}
  #ov .cap{position:absolute;z-index:5;left:50%;bottom:134px;transform:translateX(-50%) scale(.92);max-width:372px;width:max-content;
    padding:11px 18px 12px;border-radius:20px;background:rgba(27,12,48,.92);color:#fff;font-weight:800;font-size:21px;
    line-height:1.22;text-align:center;text-wrap:balance;opacity:0;transition:opacity .2s,transform .26s cubic-bezier(.2,1.5,.4,1);
    box-shadow:0 10px 30px rgba(0,0,0,.3)}
  #ov .cap.on{opacity:1;transform:translateX(-50%) scale(1)}
  #ov .cap b{color:#ff7ab8;font-weight:800}
  #ov .finger{position:absolute;z-index:7;left:0;top:0;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;
    background:rgba(255,255,255,.95);border:3px solid ${PINK};box-shadow:0 4px 14px rgba(0,0,0,.35);opacity:0;
    transition:transform .38s cubic-bezier(.3,.8,.3,1),opacity .2s,scale .12s}
  #ov .finger.down{scale:.78}
  #ov .ripple{position:absolute;z-index:7;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;border:3px solid ${PINK};
    animation:ovr .55s ease-out forwards}
  @keyframes ovr{from{transform:scale(.6);opacity:.95}to{transform:scale(2.6);opacity:0}}
  #ov .spot{position:absolute;z-index:2;border-radius:18px;box-shadow:0 0 0 2000px rgba(20,8,35,.58);
    outline:3px solid ${PINK};outline-offset:2px;opacity:0;transition:opacity .25s,left .3s,top .3s,width .3s,height .3s}
  #ov .spot.on{opacity:1;animation:ovp 1.1s ease-in-out infinite}
  @keyframes ovp{50%{outline-color:#fff}}
  #ov .bar{position:absolute;z-index:6;left:16px;right:16px;top:62px;display:flex;gap:4px}
  #ov .bar i{flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,.55);overflow:hidden;
    box-shadow:0 0 0 1px rgba(27,12,48,.18)}
  #ov .bar i u{display:block;height:100%;width:0;background:${PINK}}
  #ov .bar i.done u{width:100%}
  #ov .card{position:absolute;inset:0;z-index:1;opacity:0;transition:opacity .28s;overflow:hidden}
  #ov .card.on{opacity:1}
  @keyframes ovshake{0%,100%{transform:translate(0,0) rotate(0)}25%{transform:translate(-2px,1px) rotate(-.4deg)}
    75%{transform:translate(2px,-1px) rotate(.4deg)}}
  @keyframes ovpop{from{transform:scale(.7);opacity:0}to{transform:scale(1);opacity:1}}
  `;
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const fmt = (t) => esc(t).replace(/\[\[(.+?)\]\]/g, "<b>$1</b>");

  const root = () => {
    let r = document.getElementById("ov");
    if (!r) {
      const st = document.createElement("style");
      st.textContent = css;
      document.documentElement.appendChild(st);
      r = document.createElement("div");
      r.id = "ov";
      document.documentElement.appendChild(r);
    }
    return r;
  };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let finger = null;
  let sumir = 0;
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  window.__ov = {
    // legenda grande no pé da tela; [[palavra]] vira destaque rosa
    cap(text) {
      const r = root();
      r.querySelectorAll(".cap").forEach((o) => {
        o.classList.remove("on");
        setTimeout(() => o.remove(), 220);
      });
      if (!text) return;
      const d = document.createElement("div");
      d.className = "cap";
      d.innerHTML = fmt(text);
      r.appendChild(d);
      requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add("on")));
    },
    // dedo se move até (x,y) e toca
    async tap(x, y) {
      const r = root();
      if (!finger) {
        finger = document.createElement("div");
        finger.className = "finger";
        finger.style.transform = `translate(${x}px,${y + 90}px)`;
        r.appendChild(finger);
        await wait(30);
      }
      finger.style.opacity = "1";
      finger.style.transform = `translate(${x}px,${y}px)`;
      await wait(420);
      finger.classList.add("down");
      const rp = document.createElement("div");
      rp.className = "ripple";
      rp.style.left = x + "px";
      rp.style.top = y + "px";
      r.appendChild(rp);
      setTimeout(() => rp.remove(), 600);
      await wait(110);
      finger.classList.remove("down");
      clearTimeout(sumir);
      sumir = setTimeout(() => { if (finger) finger.style.opacity = "0"; }, 800);
    },
    fingerOff() {
      if (finger) finger.style.opacity = "0";
    },
    // escurece tudo, exceto o retângulo {x,y,w,h}
    spot(rc, pad = 6) {
      const r = root();
      let s = r.querySelector(".spot");
      if (!s) {
        s = document.createElement("div");
        s.className = "spot";
        r.appendChild(s);
      }
      s.style.left = rc.x - pad + "px";
      s.style.top = rc.y - pad + "px";
      s.style.width = rc.w + pad * 2 + "px";
      s.style.height = rc.h + pad * 2 + "px";
      requestAnimationFrame(() => s.classList.add("on"));
    },
    spotOff() {
      const s = root().querySelector(".spot");
      if (s) s.classList.remove("on");
    },
    // barra de capítulos estilo "stories": i = capítulo atual (1..n), ms = tempo para encher
    bar(i, n, ms) {
      const r = root();
      let b = r.querySelector(".bar");
      if (b) b.remove();
      b = document.createElement("div");
      b.className = "bar";
      for (let k = 1; k <= n; k++) {
        const seg = document.createElement("i");
        const u = document.createElement("u");
        seg.appendChild(u);
        if (k < i) seg.classList.add("done");
        if (k === i) u.style.transition = `width ${ms}ms linear`;
        b.appendChild(seg);
      }
      r.appendChild(b);
      const cur = b.children[i - 1] && b.children[i - 1].firstChild;
      if (cur) requestAnimationFrame(() => requestAnimationFrame(() => (cur.style.width = "100%")));
    },
    // cartão de tela cheia (HTML livre); some com cardOff()
    card(html) {
      const r = root();
      const c = document.createElement("div");
      c.className = "card";
      c.innerHTML = html;
      r.appendChild(c);
      requestAnimationFrame(() => requestAnimationFrame(() => c.classList.add("on")));
    },
    cardOff() {
      root().querySelectorAll(".card").forEach((c) => {
        c.classList.remove("on");
        setTimeout(() => c.remove(), 300);
      });
    },
    // número que sobe de 0 até `to` dentro de `el` (moeda ou inteiro)
    async count(el, to, ms, money) {
      const t0 = performance.now();
      const show = (v) => {
        el.textContent = money
          ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/ /g, " ")
          : String(Math.round(v));
      };
      for (;;) {
        const k = Math.min(1, (performance.now() - t0) / ms);
        show(to * ease(k));
        if (k >= 1) break;
        await wait(16);
      }
      show(to);
    },
    // rola (janela ou a caixa rolável mais próxima, como um modal) até o topo de `el` ficar em y
    async revealEl(el, y, ms) {
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
    // rolagem suave da janela até y
    async scrollTo(y, ms) {
      const y0 = window.scrollY;
      const t0 = performance.now();
      for (;;) {
        const k = Math.min(1, (performance.now() - t0) / ms);
        window.scrollTo(0, y0 + (y - y0) * ease(k));
        if (k >= 1) break;
        await wait(16);
      }
    },
  };
}
