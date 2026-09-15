import { MercadoPagoConfig } from "mercadopago";

// Access Token fica só no backend (secret do Firebase) — nunca no frontend,
// que usa apenas a Public Key pra inicializar os Bricks.
export function getMercadoPagoConfig(): MercadoPagoConfig {
  return new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? "" });
}
