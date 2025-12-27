import { Response } from 'express';
export declare class ImageProxyController {
    proxy(url: string, res: Response): Promise<Response<any, Record<string, any>>>;
}
