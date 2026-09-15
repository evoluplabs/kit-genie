"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMercadoPagoConfig = getMercadoPagoConfig;
const mercadopago_1 = require("mercadopago");
// Access Token fica só no backend (secret do Firebase) — nunca no frontend,
// que usa apenas a Public Key pra inicializar os Bricks.
function getMercadoPagoConfig() {
    var _a;
    return new mercadopago_1.MercadoPagoConfig({ accessToken: (_a = process.env.MERCADOPAGO_ACCESS_TOKEN) !== null && _a !== void 0 ? _a : "" });
}
//# sourceMappingURL=mercadopago-client.js.map