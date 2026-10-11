// Cartões de tela cheia (HTML puro) usados em cenas sem tela do app: a planilha bagunçada
// do gancho, a conversa de exemplo do WhatsApp e o fechamento neutro.
// Medidas em px CSS de uma tela 405×720. Nada aqui é dado real de ninguém.

const ROSA = "#ec4899";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

/** Planilha cheia de erros: a "dor" que abre o vídeo. */
export function planilha() {
  const linhas = [
    ["Camila", "12/10", "Mickey", "1290", "painel ok?"],
    ["Fer.", "12/10 ???", "Mickey", "1.290", "DUPLICOU"],
    ["Juliana", "15", "loc.", "650", "pagou?"],
    ["Renata", "", "Jardim", "1150", "ver estoque"],
    ["#REF!", "#REF!", "", "#REF!", ""],
    ["Bia", "19/10", "Unic.", "980", "fita acabou?"],
    ["Paty", "—", "Batman", "480", "???"],
    ["Mônica", "6", "Batman", "480 (ou 500)", "sinal?"],
  ];
  const marca = (l, c) => {
    const v = l[c];
    if (v === "#REF!") return "background:#ffd6d6;color:#c00;font-weight:700";
    if (v === "DUPLICOU") return "background:#ffb3b3;color:#900;font-weight:800";
    if (c === 4 && v) return "background:#fff4a8";
    if (c === 1 && v.includes("?")) return "background:#ffe0b3";
    return "";
  };
  const tr = linhas
    .map((l, r) => `<tr><td class="n">${r + 2}</td>${l.map((v, c) => `<td style="${marca(l, c)}">${esc(v)}</td>`).join("")}</tr>`)
    .join("");
  return `
  <div style="position:absolute;inset:0;background:#fff;font-family:Arial,Helvetica,sans-serif;color:#222">
    <style>
      .pl td,.pl th{border:1px solid #cfcfcf;padding:0 6px;height:44px;font-size:13.5px;white-space:nowrap;overflow:hidden}
      .pl th{background:#f1f1f1;font-weight:600;color:#555;height:30px;font-size:12px}
      .pl .n{background:#f1f1f1;color:#777;text-align:center;width:22px;padding:0}
      @keyframes pltrem{0%,100%{transform:translate(0,0) rotate(0)}30%{transform:translate(-2px,1px) rotate(-.35deg)}70%{transform:translate(2px,-1px) rotate(.35deg)}}
      @keyframes plnota{from{transform:scale(.5) rotate(0);opacity:0}to{opacity:1}}
    </style>
    <div style="height:44px;background:#1e7145;color:#fff;display:flex;align-items:center;padding:0 14px;font-size:13px;font-weight:600;position:relative;top:70px">
      Planilha_Festas_FINAL_v7 (cópia).xlsx</div>
    <div style="position:absolute;left:0;right:0;top:114px;animation:pltrem .5s infinite">
      <table class="pl" style="border-collapse:collapse;width:100%;table-layout:fixed">
        <colgroup><col style="width:22px"><col style="width:20%"><col style="width:19%"><col style="width:17%"><col style="width:19%"><col></colgroup>
        <tr><th></th><th>A · Cliente</th><th>B · Data</th><th>C · Kit</th><th>D · Valor</th><th>E · Obs</th></tr>
        ${tr}
      </table>
    </div>
        <div style="position:absolute;right:10px;top:96px;width:124px;padding:10px;background:#fff176;box-shadow:0 6px 14px rgba(0,0,0,.3);
      transform:rotate(6deg);font:700 14px 'Plus Jakarta Sans',sans-serif;color:#5d4600;animation:plnota .4s .7s both">tem painel livre dia 12? 🤔</div>
    <div style="position:absolute;left:10px;top:318px;width:134px;padding:10px;background:#ffab91;box-shadow:0 6px 14px rgba(0,0,0,.3);
      transform:rotate(-5deg);font:700 14px 'Plus Jakarta Sans',sans-serif;color:#6b1f0a;animation:plnota .4s 1.2s both">quem pagou o sinal?? 😬</div>
    <div style="position:absolute;left:0;right:0;top:500px;display:flex;gap:2px;padding:0 6px;font-size:11px;color:#444">
      <span style="background:#e8e8e8;padding:5px 9px;border-radius:0 0 6px 6px">Planilha1</span>
      <span style="background:#e8e8e8;padding:5px 9px;border-radius:0 0 6px 6px">Planilha1 (cópia)</span>
      <span style="background:#fff;border:1px solid #bbb;border-top:0;padding:5px 9px;border-radius:0 0 6px 6px;font-weight:700">agora vai</span>
    </div>
  </div>`;
}

/** Conversa de exemplo do robô de WhatsApp (marcada como exemplo; sem preços). */
export function conversa() {
  const msgs = [
    ["l", "Oi! Tem o Kit Jardim Encantado pra sábado?"],
    ["r", "Oi! 💕 Tenho sim, está disponível nessa data. Posso mandar as fotos?"],
    ["r", "📸 Kit Jardim Encantado: arco floral, mesa e painel. Fechamos?"],
    ["l", "Pode ser! Confirmo o pix amanhã."],
    ["s", "✓ Pré-reserva criada · agenda atualizada · você foi avisada"],
  ];
  const bolhas = msgs
    .map(([lado, t], i) => {
      const cor = lado === "l" ? "#fff" : lado === "r" ? "#d9fdd3" : "#fff3cd";
      const al = lado === "l" ? "flex-start" : lado === "r" ? "flex-end" : "center";
      const sz = lado === "s" ? "11.5px" : "14.5px";
      return `<div style="display:flex;justify-content:${al};opacity:0;animation:cvin .35s ${0.5 + i * 0.75}s forwards">
        <div style="max-width:78%;padding:8px 11px;border-radius:12px;background:${cor};font-size:${sz};line-height:1.3;color:#1c1c1c;
          box-shadow:0 1px 1px rgba(0,0,0,.15);font-weight:${lado === "s" ? 700 : 500}">${esc(t)}</div></div>`;
    })
    .join("");
  return `
  <div style="position:absolute;inset:0;background:#efeae2;font-family:'Plus Jakarta Sans',sans-serif">
    <style>@keyframes cvin{from{transform:translateY(10px);opacity:0}to{transform:none;opacity:1}}</style>
    <div style="position:absolute;left:0;right:0;top:70px;height:62px;background:#0b6b5d;color:#fff;display:flex;align-items:center;gap:10px;padding:0 14px">
      <div style="width:38px;height:38px;border-radius:50%;background:#25a18e;display:grid;place-items:center;font-weight:800">A</div>
      <div><div style="font-weight:700;font-size:14px">Seu ateliê</div>
      <div style="font-size:10px;opacity:.85">online · respondendo automaticamente</div></div>
    </div>
    <div style="position:absolute;left:12px;right:12px;top:176px;display:flex;flex-direction:column;gap:10px">${bolhas}</div>
    <div style="position:absolute;left:50%;top:142px;transform:translateX(-50%);background:rgba(27,12,48,.85);color:#fff;
      font-size:10.5px;font-weight:700;padding:5px 12px;border-radius:999px;letter-spacing:.02em;white-space:nowrap">EXEMPLO DE CONVERSA · PLANO PREMIUM</div>
  </div>`;
}

/** Fechamento neutro: sem marca, sem preço, sem contato (campos editáveis em config.json). */
export function fechamento(cfg) {
  const palavras = ["Kits.", "Estoque.", "Agenda.", "Lucro."]
    .map((p, i) => `<div style="opacity:0;animation:fpop .4s ${0.25 + i * 0.35}s forwards">${p}</div>`)
    .join("");
  const rodape = cfg.rodape ? `<div style="margin-top:14px;font-size:15px;font-weight:600;opacity:.95">${esc(cfg.rodape)}</div>` : "";
  return `
  <div style="position:absolute;inset:0;background:linear-gradient(160deg,${ROSA},#be185d 70%);color:#fff;text-align:center;
    font-family:'Plus Jakarta Sans',sans-serif;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:0 24px 120px">
    <style>@keyframes fpop{from{transform:scale(.8) translateY(8px);opacity:0}to{transform:none;opacity:1}}</style>
    <div style="font:700 44px/1.12 'Playfair Display',serif">${palavras}</div>
    <div style="margin-top:22px;font-size:19px;font-weight:600;opacity:0;animation:fpop .4s 1.8s forwards">${esc(cfg.linha1)}</div>
    <div style="margin-top:10px;font-size:23px;font-weight:800;opacity:0;animation:fpop .4s 2.3s forwards">${esc(cfg.linha2)}</div>
    <div style="opacity:0;animation:fpop .4s 2.6s forwards">${rodape}</div>
  </div>`;
}
