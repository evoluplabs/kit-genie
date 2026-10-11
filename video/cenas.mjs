// As 8 seções do vídeo. Cada uma é um mini-roteiro de gestos: legenda, toque, destaque.
// `dur` é a duração final em segundos; `inicio` é a tela em que a gravação começa.
// Regras de redação das legendas: ≤ 48 caracteres, uma ideia por legenda, [[palavra]] = destaque.
import fs from "node:fs";
import { planilha, conversa, fechamento } from "./cartoes.mjs";

const CONFIG = JSON.parse(fs.readFileSync(new URL("./config.json", import.meta.url), "utf8"));

/** Cartão (bloco) arredondado da tela que contém o texto dado. */
const cartao = (c, texto) =>
  c.page.getByText(texto, { exact: false }).first().locator("xpath=ancestor::*[contains(@class,'rounded-2xl')][1]");

/** Data de hoje + n dias no formato AAAA-MM-DD (fuso de São Paulo), para campos de data. */
const iso = (n) => {
  const d = new Date(Date.now() + n * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d);
};
const diaDoMes = (n) => Number(iso(n).slice(8));

export const SECOES = [
  // ───────────────────────────── 1. GANCHO ─────────────────────────────
  {
    n: 1, id: "01-gancho", titulo: "Gancho", dur: 9.6, inicio: "/app",
    async antes(c) {
      await c.page.evaluate((h) => { window.__ov.card(h); }, planilha());
      await c.say("Já alugou o mesmo painel pra [[duas festas]]?");
    },
    async run(c) {
      await c.wait(2200);
      await c.say("Planilha e WhatsApp: a conta [[nunca fecha]].", 2300);
      await c.say("");
      await c.cardOff();
      await c.wait(450);
      await c.say("Agora imagine [[tudo num só lugar]].", 2200);
      await c.scroll(120, 900);
      await c.say("Estoque, agenda e lucro. [[No celular.]]", 1500);
    },
  },

  // ───────────────────────────── 2. PAINEL ─────────────────────────────
  {
    n: 2, id: "02-painel", titulo: "Painel do dia", dur: 14, inicio: "/app",
    async run(c) {
      const p = c.page;
      c.say("Abriu o app? Já vê como está o [[mês]].");
      await c.wait(400);
      await c.count(p.getByText("R$ 9.100,00", { exact: true }).first(), 9100, 1400);
      await c.wait(1000);

      await c.say("[[Lucro]] do mês, sem planilha.");
      await c.spot(cartao(c, "Lucro estimado"), 2200);

      const meta = cartao(c, "Meta do mês");
      await c.reveal(meta, 200, 700);
      await c.say("Meta do mês acompanhada [[ao vivo]].");
      await c.spot(meta, 2200);

      const alerta = cartao(c, "Alertas de estoque");
      await c.reveal(alerta, 200, 800);
      await c.say("O que está acabando, ele [[avisa antes]].");
      await c.spot(alerta, 2400);

      await c.say("Tudo isso nasce das suas [[vendas]].", 1800);
    },
  },

  // ─────────────────────── 3. KITS E LISTA DE MATERIAIS ───────────────────────
  {
    n: 3, id: "03-kits", titulo: "Kits e lista de materiais", dur: 17, inicio: "/app/kits",
    async run(c) {
      const p = c.page;
      await c.say("Cada kit tem sua [[lista de materiais]].", 1200);
      await c.scroll(260, 1000);
      await c.wait(500);
      await c.reveal(p.getByText("Kit Mickey Premium").first(), 330, 600);
      await c.tap(p.getByText("Kit Mickey Premium").first(), 900);

      await c.say("Cada peça com [[quantidade]] e custo.");
      const bom = p.getByText("Materiais do kit (BOM)").first();
      await c.reveal(bom, 150, 1100);
      await c.wait(900);

      await c.say("Custo e [[margem]] calculados na hora.");
      await c.spot(p.getByText(/Custo:/).first().locator(".."), 2500, 10);

      await c.say("Bronze, prata ou ouro: [[3 preços]] num kit só.");
      const tiers = p.getByText("Tiers Bronze / Prata / Ouro").first();
      await c.reveal(tiers, 230, 900);
      await c.spot(tiers.locator("xpath=ancestor::*[contains(@class,'rounded')][1]"), 2400, 8);

      await c.tap(p.getByRole("button", { name: "Cancelar" }).first(), 400);
      await c.say("E cada peça já tem [[estoque próprio]].", 1600);
    },
  },

  // ─────────────────── 4. VENDA QUE MEXE NO ESTOQUE ───────────────────
  {
    n: 4, id: "04-venda", titulo: "Venda que baixa o estoque", dur: 26, inicio: "/app/sales",
    async run(c) {
      const p = c.page;
      await c.say("Fechou venda? Registra em [[segundos]].", 800);
      await c.tap(p.getByText("Nova locação").first(), 900);
      await c.type(p.getByPlaceholder("Nome completo"), "Beatriz Lopes", 60);
      await c.say("Escolhe o kit e o [[nível]].");
      await c.tap(p.getByRole("button", { name: /Ouro/ }).first(), 700);

      // mesma data de outro cliente com o mesmo kit → o sistema avisa
      const datas = p.locator('input[type="date"]');
      await c.reveal(datas.first(), 200, 700);
      await datas.first().fill(iso(12));
      await datas.nth(1).fill(iso(13));
      await c.say("Mesmo kit, mesma data? Ele [[avisa]].");
      const aviso = p.getByText("kit já agendado nesse período").first().locator("xpath=ancestor::*[contains(@class,'rounded-xl')][1]");
      await c.reveal(aviso, 300, 700);
      await c.spot(aviso, 2600, 6);

      // data livre → disponível
      await datas.first().fill(iso(7));
      await datas.nth(1).fill(iso(8));
      await c.say("Outra data: [[tudo disponível]].");
      const ok = p.getByText("Disponível!").first().locator("xpath=ancestor::*[contains(@class,'rounded-xl')][1]");
      await c.reveal(ok, 300, 500);
      await c.spot(ok, 2200, 6);

      await c.tap(p.getByRole("button", { name: "Registrar locação" }), 400);
      await c.say("Salvou? O estoque [[baixa sozinho]].", 1700);

      await c.say("No Acervo, a conta já [[atualizou]].");
      await c.nav("Acervo");
      await c.tap(p.locator("button:has(svg.lucide-layout-grid)").first(), 600);
      const balao = p.locator("div.rounded-2xl").filter({ hasText: "Balão Látex Rosa Pastel G" }).filter({ hasText: "pct" }).first();
      await c.reveal(balao, 250, 800);
      await c.say("Balões: de 8 para [[6 pacotes]].");
      await c.spot(balao, 2600, 6);
    },
  },

  // ───────────────────────────── 5. AGENDA ─────────────────────────────
  {
    n: 5, id: "05-agenda", titulo: "Agenda", dur: 10, inicio: "/app/sales",
    async run(c) {
      const p = c.page;
      await c.say("Sua agenda de [[festas]], mês a mês.", 600);
      await c.tap(p.getByText("Calendário").first(), 900);
      await c.scroll(260, 900);
      await c.wait(600);
      await c.say("Toque no dia: [[cliente, kit e valor]].");
      await c.tap(p.getByRole("button", { name: new RegExp(`^${diaDoMes(3)}$`) }).first(), 900);
      await c.scroll(300, 900);
      await c.wait(1800);
      await c.say("Nada de [[esquecer]] uma entrega.", 1500);
    },
  },

  // ───────────────────── 6. FINANÇAS E RELATÓRIOS ─────────────────────
  {
    n: 6, id: "06-financas", titulo: "Finanças e relatórios", dur: 14, inicio: "/app/finance",
    async run(c) {
      const p = c.page;
      await c.say("Custos do negócio e pessoais, [[separados]].");
      await c.spot(cartao(c, "Custos profissionais"), 2200);
      await c.say("Lucro do negócio: receita menos [[custos]].");
      await c.count(cartao(c, "Lucro líquido").getByText("R$ 6.300,00", { exact: true }).first(), 6300, 1300);
      await c.spot(cartao(c, "Lucro líquido"), 1400);
      await c.nav("Relatórios");
      await c.say("Tudo exportável para o [[contador]].");
      const csv = cartao(c, "Estoque completo");
      await c.reveal(csv, 300, 800);
      await c.spot(csv, 2400, 6);
      await c.say("Vendas, estoque, financeiro e [[kits]].", 1500);
    },
  },

  // ───────────────────── 7. CLIENTES E WHATSAPP ─────────────────────
  {
    n: 7, id: "07-clientes", titulo: "Clientes e WhatsApp", dur: 11.5, inicio: "/app/customers",
    async run(c) {
      const p = c.page;
      await c.say("Quem compra mais fica no [[radar]].");
      await c.spot(cartao(c, "Clientes VIP"), 2200);
      const pano = cartao(c, "Panorama de fidelidade");
      await c.reveal(pano, 200, 900);
      await c.spot(pano, 2000, 4);
      await c.say("E o WhatsApp [[responde por você]].");
      await c.page.evaluate((h) => window.__ov.card(h), conversa());
      await c.wait(3000);
      await c.say("Você só confirma o [[pix]].", 2600);
    },
  },

  // ───────────────────────────── 8. FECHAMENTO ─────────────────────────────
  {
    n: 8, id: "08-fechamento", titulo: "Fechamento", dur: 6, inicio: "/app",
    async antes(c) {
      await c.page.evaluate((h) => window.__ov.card(h), fechamento(CONFIG.fechamento));
    },
    async run(c) {
      await c.wait(5500);
    },
  },
];
