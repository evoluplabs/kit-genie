"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.weeklyReport = void 0;
const functions = __importStar(require("firebase-functions/v2/scheduler"));
const admin = __importStar(require("firebase-admin"));
const nodemailer = __importStar(require("nodemailer"));
if (!admin.apps.length)
    admin.initializeApp();
const db = admin.firestore();
// Executa toda segunda-feira às 8h (horário de Brasília = UTC-3)
exports.weeklyReport = functions.onSchedule({ schedule: "0 11 * * 1", timeZone: "America/Sao_Paulo" }, async () => {
    var _a, _b, _c, _d;
    const transporter = nodemailer.createTransport({
        host: (_a = process.env.SMTP_HOST) !== null && _a !== void 0 ? _a : "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
    const usersSnap = await db.collection("users").listDocuments();
    for (const userRef of usersSnap) {
        try {
            const settingsSnap = await userRef.collection("meta").doc("settings").get();
            if (!settingsSnap.exists)
                continue;
            const settings = settingsSnap.data();
            if (!settings.notifyWeeklyReport || !settings.weeklyReportEmail)
                continue;
            const profileSnap = await userRef.collection("meta").doc("profile").get();
            const profile = profileSnap.data();
            // Vendas da semana passada
            const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            const salesSnap = await userRef.collection("sales")
                .where("eventDate", ">=", weekAgo)
                .get();
            const sales = salesSnap.docs.map(d => d.data());
            const activeSales = sales.filter(s => s.status !== "cancelado");
            const totalRevenue = activeSales.reduce((acc, s) => { var _a; return acc + ((_a = s.totalPrice) !== null && _a !== void 0 ? _a : 0); }, 0);
            // Alertas de estoque baixo
            const componentsSnap = await userRef.collection("components").get();
            const lowStock = componentsSnap.docs
                .map(d => d.data())
                .filter(c => c.stock <= c.minStock);
            const html = buildEmailHtml({
                businessName: (_b = profile === null || profile === void 0 ? void 0 : profile.businessName) !== null && _b !== void 0 ? _b : "sua empresa",
                ownerName: (_c = profile === null || profile === void 0 ? void 0 : profile.ownerName) !== null && _c !== void 0 ? _c : "",
                activeSalesCount: activeSales.length,
                totalRevenue,
                lowStockItems: lowStock.map(c => c.name),
            });
            await transporter.sendMail({
                from: `"Decora Gestão" <${process.env.SMTP_USER}>`,
                to: settings.weeklyReportEmail,
                subject: `Resumo semanal — ${(_d = profile === null || profile === void 0 ? void 0 : profile.businessName) !== null && _d !== void 0 ? _d : "Decora Gestão"}`,
                html,
            });
            console.log(`[weekly-report] Enviado para ${settings.weeklyReportEmail}`);
        }
        catch (err) {
            console.error(`[weekly-report] Erro para usuário ${userRef.id}`, err);
        }
    }
});
function buildEmailHtml(data) {
    const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family:sans-serif;background:#fdf2f8;margin:0;padding:0">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #f3e8f8">
    <div style="background:linear-gradient(135deg,#c084fc,#e879f9);padding:32px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:800">Decora Gestão</h1>
      <p style="color:rgba(255,255,255,.85);margin:8px 0 0;font-size:14px">Resumo semanal — ${new Date().toLocaleDateString("pt-BR")}</p>
    </div>
    <div style="padding:32px">
      <p style="color:#374151;margin-bottom:24px">Olá${data.ownerName ? `, ${data.ownerName}` : ""}! Aqui está o resumo da semana de <strong>${data.businessName}</strong>:</p>

      <div style="display:flex;gap:16px;margin-bottom:24px">
        <div style="flex:1;background:#fdf4ff;border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:32px;font-weight:800;color:#a855f7">${data.activeSalesCount}</div>
          <div style="font-size:12px;color:#9ca3af;margin-top:4px">EVENTOS NA SEMANA</div>
        </div>
        <div style="flex:1;background:#f0fdf4;border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:32px;font-weight:800;color:#16a34a">${brl(data.totalRevenue)}</div>
          <div style="font-size:12px;color:#9ca3af;margin-top:4px">RECEITA GERADA</div>
        </div>
      </div>

      ${data.lowStockItems.length > 0 ? `
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px;margin-bottom:24px">
        <div style="font-weight:700;color:#ea580c;margin-bottom:8px">⚠️ Estoque baixo</div>
        <ul style="margin:0;padding-left:20px;color:#9a3412;font-size:14px">
          ${data.lowStockItems.map(n => `<li>${n}</li>`).join("")}
        </ul>
      </div>` : `
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin-bottom:24px">
        <div style="color:#16a34a;font-weight:700">✅ Estoque em dia</div>
        <p style="color:#166534;font-size:14px;margin:4px 0 0">Todos os componentes acima do mínimo.</p>
      </div>`}

      <p style="color:#6b7280;font-size:12px;text-align:center;margin-top:24px">
        Decora Gestão · para descadastrar, desative o resumo semanal nas Configurações.
      </p>
    </div>
  </div>
</body>
</html>`;
}
//# sourceMappingURL=weekly-report.js.map