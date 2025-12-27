"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageProxyController = void 0;
const common_1 = require("@nestjs/common");
let ImageProxyController = class ImageProxyController {
    async proxy(url, res) {
        if (!url)
            return res.status(400).send('Image url missing');
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
                    'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': new URL(url).origin,
                },
            });
            if (!response.ok)
                return res.status(502).send('Unable to fetch image');
            const buffer = Buffer.from(await response.arrayBuffer());
            res.setHeader('Content-Type', response.headers.get('content-type') || 'image/png');
            res.setHeader('Cache-Control', 'public, max-age=31536000');
            res.send(buffer);
        }
        catch {
            res.status(502).send('Unable to fetch image');
        }
    }
};
exports.ImageProxyController = ImageProxyController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('url')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ImageProxyController.prototype, "proxy", null);
exports.ImageProxyController = ImageProxyController = __decorate([
    (0, common_1.Controller)('image-proxy')
], ImageProxyController);
//# sourceMappingURL=image-proxy.controller.js.map