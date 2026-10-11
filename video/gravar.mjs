// Grava cada seção do vídeo a partir do app rodando (dados fictícios), dentro do "palco" (palco.mjs).
// Uso:  node gravar.mjs            → todas as seções
//       node gravar.mjs 02 04      → só as seções 02 e 04
// Pré-requisito: app no ar em APP_URL (padrão http://127.0.0.1:5173), ver README.md.
import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { installPalco } from "./palco.mjs";
import { SECOES } from "./cenas.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.APP_URL ?? "http://127.0.0.1:5173";
const CHROME = process.env.CHROME_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
export const BRUTO = path.join(AQUI, "saida", "bruto");
export const VIEW = { width: 1080, height: 1920 }; // palco 9:16; o app (405×720) fica dentro dele
export const FPS = 30;

/** Gestos que as cenas usam. Coordenadas "do app" = px CSS da tela de 405×720. */
export class Cena {
  constructor(page, frame, secao) {
    this.page = page;
    this.app = frame;
    this.secao = secao;
    this.foco = null;
  }
  wait(ms) { return this.page.waitForTimeout(ms); }
  v(fn, arg) { return this.page.evaluate(fn, arg); }
  rectOf(loc) { return loc.evaluate((el) => window.__h.rect(el)); }
  async rect(alvo) { return alvo.evaluate ? this.rectOf(alvo) : alvo; }

  // ── câmera ──
  /** Aproxima a câmera de um elemento (loc) ou retângulo. z = zoom; fy = altura do foco no palco. */
  async zoomTo(alvo, z = 1.4, { ms = 800, fy = 0.42, espera = true } = {}) {
    const r = await this.rect(alvo);
    // nunca aproxima a ponto de cortar o elemento (cartões largos ganham pouco zoom)
    const zz = Math.max(1, Math.min(z, (0.94 * 405) / r.w, (0.8 * 720) / r.h));
    const p = this.v(([z, cx, cy, ms, fy]) => window.__v.cam(z, cx, cy, ms, fy), [zz, r.x + r.w / 2, r.y + r.h / 2, ms, fy]);
    if (espera) await p; else p.catch(() => {});
    this.foco = r;
  }
  /** Volta para a tela inteira. */
  async zoomOut(ms = 700, espera = true) {
    const p = this.v(([ms]) => window.__v.cam(1, 202.5, 360, ms, 0.5), [ms]);
    if (espera) await p; else p.catch(() => {});
    this.foco = null;
  }
  /** Aproximação lenta e contínua (respiro), sem esperar. */
  drift(z, ms) {
    this.v(([z, ms]) => window.__v.cam(z, 202.5, 330, ms, 0.5), [z, ms]).catch(() => {});
  }

  // ── textos e destaques ──
  /** Legenda curta que some sozinha. `em` = elemento/retângulo que ela não pode cobrir. */
  async say(text, { em, pos, hold = 0, big = false } = {}) {
    let p = pos;
    if (!p) {
      const r = em ? await this.rect(em) : this.foco;
      if (r) {
        const yPalco = await this.v(([y]) => window.__v.toStageY(y), [r.y + r.h / 2]);
        p = yPalco < 960 ? "bot" : "top";
      } else p = "bot";
    }
    await this.v(([t, o]) => window.__v.cap(t, o), [text, { pos: p, hold, big }]);
  }
  chapter(texto, ms = 1500) { return this.v(([t, m]) => window.__v.chapter(t, m), [texto, ms]); }
  async ring(alvo, pad = 5) { const r = await this.rect(alvo); await this.v(([r, p]) => window.__v.ring(r, p), [r, pad]); }
  ringOff() { return this.v(() => window.__v.ringOff()); }
  /** Etiqueta que pula, presa a um ponto do elemento (fx, fy = fração do retângulo). */
  async tag(texto, alvo, { fx = 0.5, fy = 0, ms = 1800, verde = false } = {}) {
    const r = await this.rect(alvo);
    await this.v(([t, x, y, m, g]) => window.__v.tag(t, x, y, m, g), [texto, r.x + r.w * fx, r.y + r.h * fy, ms, verde]);
  }

  // ── ações no app ──
  async reveal(loc, y = 230, ms = 700) {
    await loc.evaluate((el, [yy, m]) => window.__h.reveal(el, yy, m), [y, ms]);
    await this.wait(60);
  }
  scrollBy(dy, ms = 800) { return this.app.evaluate(([d, m]) => window.__h.scrollBy(d, m), [dy, ms]); }
  async tap(loc, hold = 200) {
    await loc.scrollIntoViewIfNeeded();
    const r = await this.rectOf(loc);
    await this.v(([x, y]) => window.__v.tap(x, y), [r.x + r.w / 2, r.y + r.h / 2]);
    await loc.evaluate((el) => el.click());
    await this.wait(hold);
  }
  async type(loc, text, delay = 38) {
    await this.tap(loc, 30);
    await loc.pressSequentially(text, { delay });
  }
  count(loc, to, ms, money = true) {
    return loc.evaluate((el, [t, m, mo]) => window.__h.count(el, t, m, mo), [to, ms, money]);
  }
  async card(html) { await this.v((h) => window.__v.card(h), html); }
  cardOff() { return this.v(() => window.__v.cardOff()); }
  /** Troca de tela com varrida rosa (cobre → muda → revela). */
  async trocaCom(fn) {
    await this.v(() => window.__v.cover(280));
    await fn();
    await this.wait(60);
    await this.v(() => window.__v.reveal(360));
  }
  /** Abre o menu (hambúrguer) e toca num item — navegação real, sem recarregar o app. */
  async nav(label) {
    await this.tap(this.app.locator("header button").last(), 250);
    await this.tap(this.app.getByRole("link", { name: label }).first(), 450);
  }
}

async function codificar(dir, frames, fim, saida) {
  // O navegador só manda quadro quando a tela muda. Montamos 1 quadro exato a cada 1/FPS s:
  // para cada instante vale o último quadro recebido até ali.
  const t0 = frames[0].t;
  const total = Math.max(1, Math.round((fim - t0) * FPS));
  let src = 0, escrito = -1, ultimo = "";
  for (let k = 0; k < total; k++) {
    const t = t0 + k / FPS;
    while (src + 1 < frames.length && frames[src + 1].t <= t) src++;
    const nome = path.join(dir, `o${String(k).padStart(5, "0")}.jpg`);
    if (src !== escrito) { await fs.writeFile(nome, Buffer.from(frames[src].d, "base64")); escrito = src; ultimo = nome; }
    else await fs.copyFile(ultimo, nome);
  }
  const r = spawnSync("ffmpeg", [
    "-y", "-loglevel", "error", "-framerate", String(FPS), "-i", path.join(dir, "o%05d.jpg"),
    "-vf", "scale=1080:1920:flags=lanczos,format=yuv420p",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "14", "-an", "-movflags", "+faststart", saida,
  ], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("ffmpeg falhou: " + r.stderr);
}

export async function gravarSecao(browser, secao) {
  const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1, locale: "pt-BR", timezoneId: "America/Sao_Paulo" });
  await ctx.addInitScript(installPalco);
  const page = await ctx.newPage();
  page.setDefaultTimeout(8000);
  await page.route("**/__palco*", (r) => r.fulfill({ contentType: "text/html", body: "<!doctype html><meta charset=utf-8><body></body>" }));
  await page.goto(`${BASE}/__palco?p=${secao.inicio ?? "/app"}`, { waitUntil: "load" });
  let frame;
  for (let i = 0; i < 60 && !frame; i++) { frame = page.frames().find((f) => f !== page.mainFrame()); if (!frame) await page.waitForTimeout(100); }
  await frame.waitForSelector(secao.pronto ?? "main h1");
  await frame.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  const dir = path.join(BRUTO, secao.id + "-quadros");
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  cdp.on("Page.screencastFrame", (e) => {
    frames.push({ t: e.metadata.timestamp, d: e.data });
    cdp.send("Page.screencastFrameAck", { sessionId: e.sessionId }).catch(() => {});
  });
  const c = new Cena(page, frame, secao);
  if (secao.antes) await secao.antes(c); // prepara o primeiro quadro (ex.: cartão já na tela)
  if (!secao.semEntrada) await c.v(() => window.__v.startCovered());
  await page.waitForTimeout(300);
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: 1080, maxHeight: 1920, everyNthFrame: 1 });
  const t0 = Date.now();
  if (!secao.semEntrada) { await c.v(() => window.__v.reveal(380)); if (secao.capitulo) c.chapter(secao.capitulo); }
  await secao.run(c);
  if (!secao.semSaida) await c.v(() => window.__v.cover(300));
  await page.waitForTimeout(120);
  const fim = Date.now() / 1000;
  const segundos = (Date.now() - t0) / 1000;
  const capMs = await page.evaluate(() => window.__v.capTotalMs());
  if (process.env.DEPURAR) { // quadros capturados por segundo (≥ 24 é fluido)
    const h = {};
    for (const f of frames) { const k = Math.floor(f.t - frames[0].t); h[k] = (h[k] ?? 0) + 1; }
    console.log("[quadros/s]", Object.values(h).join(" "));
  }
  await cdp.send("Page.stopScreencast");
  await ctx.close();

  const saida = path.join(BRUTO, secao.id + ".mp4");
  await codificar(dir, frames, fim, saida);
  await fs.rm(dir, { recursive: true, force: true });
  return { saida, quadros: frames.length, segundos, legenda: capMs / 1000 / segundos };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const so = process.argv.slice(2);
  await fs.mkdir(BRUTO, { recursive: true });
  const browser = await chromium.launch({
    executablePath: CHROME, args: ["--no-sandbox", "--lang=pt-BR"],
    env: { ...process.env, LANGUAGE: "pt-BR", LANG: "pt_BR.UTF-8" }, // campos de data em dd/mm/aaaa
  });
  for (const s of SECOES) {
    if (so.length && !so.includes(s.id.slice(0, 2))) continue;
    const r = await gravarSecao(browser, s);
    console.log(`${s.id}: ${r.segundos.toFixed(1)}s, legenda na tela ${Math.round(r.legenda * 100)}% do tempo → ${path.basename(r.saida)}`);
  }
  await browser.close();
}
