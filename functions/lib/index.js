"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hotmartWebhook = exports.assistant = exports.whatsappWebhook = exports.onComponentLowStock = exports.weeklyReport = void 0;
var weekly_report_1 = require("./weekly-report");
Object.defineProperty(exports, "weeklyReport", { enumerable: true, get: function () { return weekly_report_1.weeklyReport; } });
var low_stock_1 = require("./low-stock");
Object.defineProperty(exports, "onComponentLowStock", { enumerable: true, get: function () { return low_stock_1.onComponentLowStock; } });
var webhook_1 = require("./whatsapp/webhook");
Object.defineProperty(exports, "whatsappWebhook", { enumerable: true, get: function () { return webhook_1.whatsappWebhook; } });
var assistant_1 = require("./assistant");
Object.defineProperty(exports, "assistant", { enumerable: true, get: function () { return assistant_1.assistant; } });
var hotmart_webhook_1 = require("./payments/hotmart-webhook");
Object.defineProperty(exports, "hotmartWebhook", { enumerable: true, get: function () { return hotmart_webhook_1.hotmartWebhook; } });
//# sourceMappingURL=index.js.map