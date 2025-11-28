import type { Request, Response, NextFunction } from "express";
import { config } from "../config.js";

export function middlewareLogResponses(req: Request, res: Response, next: NextFunction): void {
    res.on("finish", () => {
        const statusCode = res.statusCode;
        if (statusCode !== 200) {
            console.log(`[NON-OK] ${req.method} ${req.originalUrl} - Status: ${statusCode}`);
        }
    });

    next();
}

export function middlewareMetricsInc(req: Request, res: Response, next: NextFunction) {
    
    res.on("finish", () => {
        config.api.fileserverHits+=1;
    });

    next();
}
