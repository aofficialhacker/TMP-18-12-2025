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
exports.ExtractionController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const extraction_service_1 = require("./extraction.service");
const verify_dto_1 = require("./dto/verify.dto");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
let ExtractionController = class ExtractionController {
    constructor(extractionService) {
        this.extractionService = extractionService;
    }
    getAllUploads() {
        return this.extractionService.getAllUploads();
    }
    getUpload(uploadId) {
        return this.extractionService.getUpload(uploadId);
    }
    getStatus(uploadId) {
        return this.extractionService.getExtractionStatus(uploadId);
    }
    getResults(uploadId) {
        return this.extractionService.getExtractionResults(uploadId);
    }
    async uploadBrochure(file, req, companyId, planId) {
        const cId = companyId ? parseInt(companyId, 10) : undefined;
        const pId = planId ? parseInt(planId, 10) : undefined;
        return this.extractionService.uploadBrochure(file, req.user.id, cId, pId);
    }
    processExtraction(uploadId) {
        return this.extractionService.processExtraction(uploadId);
    }
    verifyAndSave(uploadId, verifyDto) {
        return this.extractionService.verifyAndSave(uploadId, verifyDto);
    }
    deleteUpload(uploadId) {
        return this.extractionService.deleteUpload(uploadId);
    }
};
exports.ExtractionController = ExtractionController;
__decorate([
    (0, common_1.Get)('uploads'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ExtractionController.prototype, "getAllUploads", null);
__decorate([
    (0, common_1.Get)(':uploadId'),
    __param(0, (0, common_1.Param)('uploadId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ExtractionController.prototype, "getUpload", null);
__decorate([
    (0, common_1.Get)(':uploadId/status'),
    __param(0, (0, common_1.Param)('uploadId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ExtractionController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)(':uploadId/results'),
    __param(0, (0, common_1.Param)('uploadId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ExtractionController.prototype, "getResults", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = (0, path_1.extname)(file.originalname);
                callback(null, `brochure-${uniqueSuffix}${ext}`);
            },
        }),
        fileFilter: (req, file, callback) => {
            if (file.mimetype !== 'application/pdf') {
                callback(new Error('Only PDF files are allowed'), false);
            }
            else {
                callback(null, true);
            }
        },
        limits: {
            fileSize: 10 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Query)('companyId')),
    __param(3, (0, common_1.Query)('planId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], ExtractionController.prototype, "uploadBrochure", null);
__decorate([
    (0, common_1.Post)(':uploadId/process'),
    __param(0, (0, common_1.Param)('uploadId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ExtractionController.prototype, "processExtraction", null);
__decorate([
    (0, common_1.Post)(':uploadId/verify'),
    __param(0, (0, common_1.Param)('uploadId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, verify_dto_1.VerifyExtractionDto]),
    __metadata("design:returntype", void 0)
], ExtractionController.prototype, "verifyAndSave", null);
__decorate([
    (0, common_1.Delete)(':uploadId'),
    __param(0, (0, common_1.Param)('uploadId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ExtractionController.prototype, "deleteUpload", null);
exports.ExtractionController = ExtractionController = __decorate([
    (0, common_1.Controller)('extraction'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [extraction_service_1.ExtractionService])
], ExtractionController);
//# sourceMappingURL=extraction.controller.js.map