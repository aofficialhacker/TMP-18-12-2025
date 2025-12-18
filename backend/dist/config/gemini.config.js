"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiConfig = void 0;
const geminiConfig = () => ({
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-2.5-flash',
});
exports.geminiConfig = geminiConfig;
//# sourceMappingURL=gemini.config.js.map