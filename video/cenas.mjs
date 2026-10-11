// As 8 seções do vídeo. Cada uma é um mini-roteiro de gestos: câmera, legenda, toque, destaque.
// Princípios de edição (revisão 1): a tela do app fica livre a maior parte do tempo; a legenda é
// curta, clara e some sozinha em ~2 s; destaque = anel rosa (nada escurece); a câmera se aproxima
// do que importa e volta; nada fica parado mais de ~2 s.
// Redação das legendas: ≤ 40 caracteres, uma ideia só, [[palavra]] = destaque rosa.
import fs from "node:fs";
import { planilha, conversa, fechamento } from "./cartoes.mjs";

const CONFIG = JSON.parse(fs.readFileSync(new URL("./config.json", import.meta.url), "utf8"));

/** Cartão (bloco) arredondado do app que contém o texto dado. */
const cartao = (c, texto) =>
  c.app.getByText(texto, { exact: false }).first().locator("xpath=ancestor::*[contains(@class,'rounded-2xl')][1]");

/** Data de hoje + n dias no formato AAAA-MM-DD (fuso de São Paulo), para campos de data. */
const iso = (n) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(Date.now() + n * 86_400_000));
const diaDoMes = (n) => Number(iso(n).slice(8));

export const SECOES = [
  // ───────────────────────────── 1. GANCHO ─────────────────────────────
  {
    n: 1, id: "01-gancho", titulo: "Gancho", inicio: "/app", semEntrada: true,
    async antes(c) { await c.card(planilha()); },
    async run(c) {
      await c.say("Já alugou o mesmo painel pra [[duas festas]]?", { pos: "bot", big: true, hold: 2200 });
      await c.wait(2400);
      await c.say("Na planilha, a conta [[nunca fecha]].", { pos: "bot", hold: 1500 });
      await c.wait(1700);
      await c.trocaCom(async () => {
        await c.cardOff();
        await c.zoomTo({ x: 10, y: 40, w: 300, h: 80 }, 1.45, { ms: 1, fy: 0.3 });
      });
      c.zoomOut(1400, false);
      await c.say("Agora imagine [[tudo num só lugar]].", { pos: "bot", hold: 1600 });
      await c.wait(3000);
    },
  },

  // ───────────────────────────── 2. PAINEL ─────────────────────────────
  {
    n: 2, id: "02-painel", titulo: "Painel do dia", capitulo: "02 · Painel do dia", inicio: "/app",
    async run(c) {
      const fat = cartao(c, "Faturamento do mês");
      await c.zoomTo(fat, 1.5, { ms: 800, fy: 0.4 });
      c.say("Abriu o app? Já vê [[como está o mês]].", { em: fat });
      await c.count(c.app.getByText("R$ 9.100,00", { exact: true }).first(), 9100, 1300);
      await c.tag("+86% sobre o mês anterior", fat, { fx: 0.5, fy: 0, verde: true, ms: 1700 });
      await c.wait(1100);

      const lucro = cartao(c, "Lucro estimado");
      await c.zoomTo(lucro, 1.55, { ms: 700 });
      await c.ring(lucro, 4);
      await c.say("[[Lucro]] do mês, sem planilha.", { em: lucro });
      await c.wait(2000);
      await c.ringOff();

      await c.zoomOut(450);
      const meta = cartao(c, "Meta do mês");
      await c.reveal(meta, 260, 700);
      await c.zoomTo(meta, 1.35, { ms: 700 });
      await c.ring(meta, 4);
      await c.wait(1800);
      await c.ringOff();

      await c.zoomOut(450);
      const alerta = cartao(c, "Alertas de estoque");
      await c.reveal(alerta, 240, 800);
      await c.zoomTo(alerta, 1.35, { ms: 700 });
      await c.ring(alerta, 4);
      await c.say("Estoque acabando? Ele [[avisa antes]].", { em: alerta });
      await c.wait(2000);
      await c.ringOff();
      await c.zoomOut(500);
    },
  },

  // ─────────────────────── 3. KITS E LISTA DE MATERIAIS ───────────────────────
  {
    n: 3, id: "03-kits", titulo: "Kits e lista de materiais", capitulo: "03 · Kits e materiais", inicio: "/app/kits",
    async run(c) {
      const a = c.app;
      const kit = a.getByText("Kit Mickey Premium").first();
      c.say("Cada kit tem sua [[lista de materiais]].", { pos: "bot" });
      await c.scrollBy(300, 1200);
      await c.reveal(kit, 330, 500);
      await c.tap(kit, 700);

      const bom = a.getByText("Materiais do kit (BOM)").first();
      await c.reveal(bom, 150, 900);
      const custo = a.getByText(/Custo:/).first().locator("..");
      await c.zoomTo(custo, 1.6, { ms: 700, fy: 0.36 });
      await c.ring(custo, 8);
      const m = (await custo.innerText()).match(/margem\s*(\d+)%/);
      if (m) await c.tag(`margem ${m[1]}%`, custo, { fx: 0.8, fy: 0, verde: true, ms: 2000 });
      await c.say("Custo e [[margem]] na hora.", { em: custo });
      await c.wait(2100);
      await c.ringOff();

      await c.zoomOut(450);
      const tiers = a.getByText("Tiers Bronze / Prata / Ouro").first();
      await c.reveal(tiers, 230, 800);
      const tcard = tiers.locator("xpath=ancestor::*[contains(@class,'rounded')][1]");
      await c.zoomTo(tcard, 1.3, { ms: 700 });
      await c.ring(tcard, 6);
      await c.say("[[3 preços]] no mesmo kit.", { em: tcard });
      await c.wait(1900);
      await c.ringOff();
      await c.zoomOut(450);
      await c.tap(a.getByRole("button", { name: "Cancelar" }).first(), 250);
    },
  },

  // ─────────────────── 4. VENDA QUE MEXE NO ESTOQUE ───────────────────
  {
    n: 4, id: "04-venda", titulo: "Venda que baixa o estoque", capitulo: "04 · Venda e estoque", inicio: "/app/sales",
    async run(c) {
      const a = c.app;
      c.say("Fechou venda? [[Segundos]] pra registrar.", { pos: "bot", hold: 1700 });
      await c.tap(a.getByText("Nova locação").first(), 500);
      await c.type(a.getByPlaceholder("Nome completo"), "Beatriz Lopes", 38);
      await c.tap(a.getByRole("button", { name: /Ouro/ }).first(), 350);

      // mesma data de outro cliente com o mesmo kit → o sistema avisa
      const datas = a.locator('input[type="date"]');
      await c.reveal(datas.first(), 190, 600);
      await datas.first().fill(iso(12));
      await datas.nth(1).fill(iso(13));
      const aviso = a.getByText("kit já agendado nesse período").first().locator("xpath=ancestor::*[contains(@class,'rounded-xl')][1]");
      await c.reveal(aviso, 300, 500);
      await c.zoomTo(aviso, 1.35, { ms: 700 });
      await c.ring(aviso, 4);
      await c.say("Mesmo kit, mesma data? Ele [[avisa]].", { em: aviso });
      await c.wait(2200);
      await c.ringOff();

      // data livre → disponível
      await datas.first().fill(iso(7));
      await datas.nth(1).fill(iso(8));
      await c.zoomOut(400);
      const ok = a.getByText("Disponível!").first().locator("xpath=ancestor::*[contains(@class,'rounded-xl')][1]");
      await c.reveal(ok, 300, 500);
      await c.zoomTo(ok, 1.35, { ms: 600 });
      await c.ring(ok, 4);
      await c.tag("✓ tudo livre", ok, { fx: 0.5, fy: 0, verde: true, ms: 1700 });
      await c.wait(1700);
      await c.ringOff();
      await c.zoomOut(400);

      await c.tap(a.getByRole("button", { name: "Registrar locação" }), 300);
      await c.say("Salvou? O estoque [[baixa sozinho]].", { pos: "bot" });
      await c.wait(1800);

      await c.nav("Acervo");
      await c.tap(a.locator("button:has(svg.lucide-layout-grid)").first(), 350);
      const balao = a.locator("div.rounded-2xl").filter({ hasText: "Balão Látex Rosa Pastel G" }).filter({ hasText: "pct" }).first();
      await c.reveal(balao, 250, 700);
      await c.zoomTo(balao, 1.5, { ms: 700 });
      await c.ring(balao, 4);
      await c.tag("8 → 6", balao, { fx: 0.5, fy: 0, ms: 2200 });
      await c.say("Balões: de 8 para [[6 pacotes]].", { em: balao });
      await c.wait(2300);
      await c.ringOff();
      await c.zoomOut(500);
    },
  },

  // ───────────────────────────── 5. AGENDA ─────────────────────────────
  {
    n: 5, id: "05-agenda", titulo: "Agenda", capitulo: "05 · Agenda", inicio: "/app/sales",
    async run(c) {
      const a = c.app;
      c.say("Sua agenda de [[festas]].", { pos: "bot" });
      await c.tap(a.getByText("Calendário").first(), 500);
      await c.scrollBy(270, 800);
      const cal = a.getByText("DOM").first().locator("xpath=ancestor::*[contains(@class,'rounded-2xl')][1]");
      await c.zoomTo(cal, 1.15, { ms: 700, fy: 0.45 });
      const dia = a.getByRole("button", { name: new RegExp(`^${diaDoMes(3)}$`) }).first();
      await c.tap(dia, 350);
      await c.ring(dia, 4);
      await c.say("Toque no dia: [[cliente, kit e valor]].", { em: dia });
      await c.wait(1700);
      await c.ringOff();
      await c.zoomOut(450);
      await c.scrollBy(300, 900);
      await c.wait(1000);
    },
  },

  // ───────────────────── 6. FINANÇAS E RELATÓRIOS ─────────────────────
  {
    n: 6, id: "06-financas", titulo: "Finanças e relatórios", capitulo: "06 · Finanças", inicio: "/app/finance",
    async run(c) {
      const prof = cartao(c, "Custos profissionais");
      await c.zoomTo(prof, 1.5, { ms: 800 });
      await c.ring(prof, 4);
      await c.tag("negócio e pessoal, separados", prof, { fx: 0.5, fy: 0, verde: true, ms: 1900 });
      await c.wait(2100);
      await c.ringOff();

      const lucro = cartao(c, "Lucro líquido");
      await c.zoomTo(lucro, 1.5, { ms: 600 });
      await c.ring(lucro, 4);
      c.say("Receita menos custos: [[seu lucro]].", { em: lucro });
      await c.count(lucro.getByText("R$ 6.300,00", { exact: true }).first(), 6300, 1200);
      await c.wait(1000);
      await c.ringOff();
      await c.zoomOut(450);

      await c.nav("Relatórios");
      const csv = cartao(c, "Estoque completo");
      await c.reveal(csv, 300, 700);
      await c.zoomTo(csv, 1.4, { ms: 700 });
      await c.ring(csv, 4);
      await c.tag("CSV", csv, { fx: 0.9, fy: 0, verde: true, ms: 1700 });
      await c.say("Tudo [[exportável]] pro contador.", { em: csv });
      await c.wait(2000);
      await c.ringOff();
      await c.zoomOut(450);
    },
  },

  // ───────────────────── 7. CLIENTES E WHATSAPP ─────────────────────
  {
    n: 7, id: "07-clientes", titulo: "Clientes e WhatsApp", capitulo: "07 · Clientes e WhatsApp", inicio: "/app/customers",
    async run(c) {
      const vip = cartao(c, "Clientes VIP");
      await c.zoomTo(vip, 1.6, { ms: 800 });
      await c.ring(vip, 4);
      await c.say("Quem compra mais fica no [[radar]].", { em: vip });
      await c.wait(1900);
      await c.ringOff();
      await c.zoomOut(450);

      const pano = cartao(c, "Panorama de fidelidade");
      await c.reveal(pano, 220, 800);
      await c.zoomTo(pano, 1.25, { ms: 700 });
      await c.wait(900);
      await c.zoomOut(350);

      await c.trocaCom(async () => { await c.card(conversa()); });
      await c.say("O [[WhatsApp]] responde por você.", { pos: "bot", hold: 1500 });
      await c.wait(2800);
      await c.say("Você só confirma o [[pix]].", { pos: "bot", hold: 1500 });
      await c.wait(1700);
    },
  },

  // ───────────────────────────── 8. FECHAMENTO ─────────────────────────────
  {
    n: 8, id: "08-fechamento", titulo: "Fechamento", inicio: "/app", semSaida: true,
    async antes(c) { await c.card(fechamento(CONFIG.fechamento)); },
    async run(c) { await c.wait(4600); },
  },
];
