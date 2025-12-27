"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const path_1 = require("path");
const fs_1 = require("fs");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    const uploadPath = (0, path_1.join)(process.cwd(), 'uploads/companies');
    if (!(0, fs_1.existsSync)(uploadPath)) {
        (0, fs_1.mkdirSync)(uploadPath, { recursive: true });
    }
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), {
        prefix: '/uploads',
        setHeaders: (res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
        },
    });
    app.enableCors({
        origin: ['http://localhost:4200'],
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 Server running at http://localhost:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map