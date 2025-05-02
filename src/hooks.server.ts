import { connectToMongoDB } from '$lib/server/database/mongodb';
import type { CookieSerializeOptions } from 'cookie';
import { connectToRedis } from '$lib/server/cache/redis';
import { connectMinioClient } from '$lib/server/cloud_storage/minio_client';
import type { Handle, RequestEvent } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { handle as authHandle } from "$lib/server/manager/auth"
import { generateNewRateLimiter, isEligibaleToRequest, isEligibleResetLimiter, newRequestOccured } from '$lib/server/rate_limiter/ratelimit_strings';
import { decryptString, encryptString } from '$lib/server/encrypt/encryptor';
import { ENABLE_RATE_LIMITING } from '$env/static/private';

await connectToMongoDB();
await connectToRedis();
connectMinioClient();

const R_LIMIT_COOKIE_NAME: string = "X-limiter";
const R_LIMIT_COOKIE_SETTINGS: CookieSerializeOptions & { path: string } = {
    secure: true,
    httpOnly: true,
    path: "/api",
    priority: "high"
};

const rateLimitMiddleware: Handle = async ({ event, resolve }) => {
    const currentUserLimit: string | undefined = event.cookies.get(R_LIMIT_COOKIE_NAME);
    const currentUserLimit_salt: string | undefined = event.cookies.get(R_LIMIT_COOKIE_NAME + "_iv");

    if (currentUserLimit == undefined || currentUserLimit_salt == undefined) await applyBrandNewLimiterToRequest(event);
    else {
        let decryptedCookieString: string;
        try {
            decryptedCookieString = await decryptString(currentUserLimit, currentUserLimit_salt);
        } catch (error) {
            await applyBrandNewLimiterToRequest(event);
            return await resolve(event);
        }
        
        if (!isEligibaleToRequest(decryptedCookieString) && ENABLE_RATE_LIMITING == "true") {
            return new Response("Too many requests, please try again later...", { status: 429 });
        }
        
        let newLimiter: { encryptedData: string, iv: string };
        if (isEligibleResetLimiter(decryptedCookieString)) newLimiter = await encryptString(generateNewRateLimiter());
        else newLimiter = await encryptString(newRequestOccured(decryptedCookieString));
        
        event.cookies.set(R_LIMIT_COOKIE_NAME, newLimiter.encryptedData, R_LIMIT_COOKIE_SETTINGS);
        event.cookies.set(R_LIMIT_COOKIE_NAME + "_iv", newLimiter.iv, R_LIMIT_COOKIE_SETTINGS);
    }

    return await resolve(event);
};

const applyBrandNewLimiterToRequest = async (event: RequestEvent<Partial<Record<string, string>>, string | null>) => {
    event.setHeaders({ "Credentials": "true" });

    const newLimiter: { encryptedData: string, iv: string } = await encryptString(generateNewRateLimiter());
    event.cookies.set(R_LIMIT_COOKIE_NAME, newLimiter.encryptedData, R_LIMIT_COOKIE_SETTINGS);
    event.cookies.set(R_LIMIT_COOKIE_NAME + "_iv", newLimiter.iv, R_LIMIT_COOKIE_SETTINGS);
}

export const handle: Handle = sequence(authHandle, rateLimitMiddleware);