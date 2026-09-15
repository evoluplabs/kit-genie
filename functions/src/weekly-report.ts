import * as functions from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// Executa toda segunda-feira às 8h (horário de Brasília = UTC-3)
export const weeklyReport = functions.onSchedule(
  { schedule: "0 11 * * 1", timeZone: "America/Sao_Paulo" },
  async () => {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "smtp.gmail.com",
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
        if (!settingsSnap.exists) continue;
        const settings = settingsSnap.data() as { notifyWeeklyReport?: boolean; weeklyReportEmail?: string };

        if (!settings.notifyWeeklyReport || !settings.weeklyReportEmail) continue;

        const profileSnap = await userRef.collection("meta").doc("profile").get();
        const profile = profileSnap.data() as { businessName?: string; ownerName?: string } | undefined;

        // Vendas da semana passada
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const salesSnap = await userRef.collection("sales")
          .where("eventDate", ">=", weekAgo)
          .get();
        const sales = salesSnap.docs.map(d => d.data() as { totalPrice: number; status: string; kitNameSnapshot: string });

        const activeSales = sales.filter(s => s.status !== "cancelado");
        const totalRevenue = activeSales.reduce((acc, s) => acc + (s.totalPrice ?? 0), 0);

        // Alertas de estoque baixo
        const componentsSnap = await userRef.collection("components").get();
        const lowStock = componentsSnap.docs
          .map(d => d.data() as { name: string; stock: number; minStock: number })
          .filter(c => c.stock <= c.minStock);

        const html = buildEmailHtml({
          businessName: profile?.businessName ?? "sua empresa",
          ownerName: profile?.ownerName ?? "",
          activeSalesCount: activeSales.length,
          totalRevenue,
          lowStockItems: lowStock.map(c => c.name),
        });

        await transporter.sendMail({
          from: `"Decora Gestão" <${process.env.SMTP_USER}>`,
          to: settings.weeklyReportEmail,
          subject: `Resumo semanal — ${profile?.businessName ?? "Decora Gestão"}`,
          html,
        });

        console.log(`[weekly-report] Enviado para ${settings.weeklyReportEmail}`);
      } catch (err) {
        console.error(`[weekly-report] Erro para usuário ${userRef.id}`, err);
      }
    }
  }
);

function buildEmailHtml(data: {
  businessName: string;
  ownerName: string;
  activeSalesCount: number;
  totalRevenue: number;
  lowStockItems: string[];
}): string {
  const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
