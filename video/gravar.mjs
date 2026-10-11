// Grava cada seção do vídeo a partir do app rodando (dados fictícios).
// Uso:  node gravar.mjs            → todas as seções
//       node gravar.mjs 02 04      → só as seções 02 e 04
// Pré-requisito: app no ar em APP_URL (padrão http://127.0.0.1:5173), ver README.md.
import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { installOverlay } from "./overlay.mjs";
import { SECOES } from "./cenas.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.APP_URL ?? "http://127.0.0.1:5173";
const CHROME = process.env.CHROME_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
export const BRUTO = path.join(AQUI, "saida", "bruto");
// Tela de 405×720 px CSS × 8/3 = 1080×1920 px no vídeo (9:16).
export const VIEW = { width: 405, height: 720 };
export const DSF = 8 / 3;
export const FPS = 30;

/** Ajudante que as cenas usam: cada método é um "gesto" visível no vídeo. */
export class Cena {
  constructor(page, idx, total) {
    this.page = page;
    this.idx = idx;
    this.total = total;
  }
  wait(ms) { return this.page.waitForTimeout(ms); }
  async say(text, ms = 0) {
    await this.page.evaluate((t) => window.__ov.cap(t), text);
    if (ms) await this.wait(ms);
  }
  hush() { return this.say(""); }
  bar(ms) { return this.page.evaluate(([i, n, m]) => window.__ov.bar(i, n, m), [this.idx, this.total, ms]); }
  async box(loc) {
    const b = await loc.boundingBox();
    if (!b) throw new Error("elemento sem posição na tela");
    return b;
  }
  /** Rola (a página ou o modal) até o topo do elemento ficar em `y` (px CSS). */
  async reveal(loc, y = 230, ms = 700) {
    await loc.evaluate((el, [yy, m]) => window.__ov.revealEl(el, yy, m), [y, ms]);
    await this.wait(80);
  }
  async scroll(dy, ms = 800) {
    await this.page.evaluate(([d, m]) => window.__ov.scrollTo(window.scrollY + d, m), [dy, ms]);
  }
  async tap(loc, hold = 250) {
    await loc.scrollIntoViewIfNeeded();
    const b = await this.box(loc);
    await this.page.evaluate(([x, y]) => window.__ov.tap(x, y), [b.x + b.width / 2, b.y + b.height / 2]);
    await loc.click({ timeout: 4000 });
    await this.wait(hold);
  }
  async type(loc, text, delay = 75) {
    await this.tap(loc, 50);
    await loc.pressSequentially(text, { delay });
  }
  async spot(loc, ms, pad = 6) {
    const b = await this.box(loc);
    await this.page.evaluate(([r, p]) => window.__ov.spot(r, p), [{ x: b.x, y: b.y, w: b.width, h: b.height }, pad]);
    await this.wait(ms);
    await this.page.evaluate(() => window.__ov.spotOff());
    await this.wait(260);
  }
  count(loc, to, ms, money = true) {
    return loc.evaluate((el, [t, m, mo]) => window.__ov.count(el, t, m, mo), [to, ms, money]);
  }
  async card(html, ms) {
    await this.page.evaluate((h) => window.__ov.card(h), html);
    await this.wait(ms);
  }
  cardOff() { return this.page.evaluate(() => window.__ov.cardOff()); }
  /** Abre o menu (hambúrguer) e toca num item — navegação real, sem recarregar o app. */
  async nav(label) {
    await this.tap(this.page.locator("header button").last(), 350);
    await this.tap(this.page.getByRole("link", { name: label }).first(), 500);
  }
}

async function codificar(dir, frames, fim, saida) {
  // O navegador só manda quadro quando a tela muda. Aqui montamos 1 quadro exato a cada 1/FPS s:
  // para cada instante, vale o último quadro recebido até ali.
  const t0 = frames[0].t;
  const total = Math.max(1, Math.round((fim - t0) * FPS));
  let src = 0;
  let escrito = -1;
  for (let k = 0; k < total; k++) {
    const t = t0 + k / FPS;
    while (src + 1 < frames.length && frames[src + 1].t <= t) src++;
    const nome = path.join(dir, `o${String(k).padStart(5, "0")}.jpg`);
    if (src !== escrito) {
      await fs.writeFile(nome, Buffer.from(frames[src].d, "base64"));
      escrito = src;
      frames.last = nome;
    } else {
      await fs.copyFile(frames.last, nome);
    }
  }
  const r = spawnSync("ffmpeg", [
    "-y", "-loglevel", "error", "-framerate", String(FPS), "-i", path.join(dir, "o%05d.jpg"),
    "-vf", "scale=1080:1920:flags=lanczos,format=yuv420p",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "14", "-an", "-movflags", "+faststart", saida,
  ], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("ffmpeg falhou: " + r.stderr);
}

export async function gravarSecao(browser, secao, idx, total) {
  const ctx = await browser.newContext({
    viewport: VIEW, deviceScaleFactor: DSF, locale: "pt-BR", timezoneId: "America/Sao_Paulo",
  });
  await ctx.addInitScript(installOverlay);
  const page = await ctx.newPage();
  page.setDefaultTimeout(8000);
  await page.goto(BASE + (secao.inicio ?? "/app"), { waitUntil: "networkidle" });
  await page.waitForSelector(secao.pronto ?? "main h1");
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
  const c = new Cena(page, idx, total);
  if (secao.antes) await secao.antes(c); // prepara o primeiro quadro (ex.: cartão já na tela)
  await page.waitForTimeout(secao.antes ? 450 : 0);
  await cdp.send("Page.startScreencast", {
    format: "jpeg", quality: 92, maxWidth: 1080, maxHeight: 1920, everyNthFrame: 1,
  });
  await c.bar(secao.dur * 1000);
  const t0 = Date.now();
  await secao.run(c);
  // completa até a duração prevista, para o corte final ser exato
  const falta = secao.dur * 1000 - (Date.now() - t0);
  if (falta > 0) await c.wait(falta);
  const fim = Date.now() / 1000;
  const segundos = (Date.now() - t0) / 1000;
  await cdp.send("Page.stopScreencast");
  await ctx.close();
  if (process.env.DEPURAR) {
    const soma = frames.length ? fim - frames[0].t : 0;
    console.log(`[depurar] 1º quadro t=${frames[0]?.t.toFixed(3)} último t=${frames.at(-1)?.t.toFixed(3)} fim=${fim.toFixed(3)} → duração pelos quadros ${soma.toFixed(2)}s; script ${segundos.toFixed(2)}s`);
  }

  const saida = path.join(BRUTO, secao.id + ".mp4");
  await codificar(dir, frames, fim, saida);
  await fs.rm(dir, { recursive: true, force: true });
  return { saida, quadros: frames.length, segundos };
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
    const r = await gravarSecao(browser, s, s.n, 8);
    console.log(`${s.id}: ${r.quadros} quadros em ${r.segundos.toFixed(1)}s → ${path.basename(r.saida)}`);
  }
  await browser.close();
}
