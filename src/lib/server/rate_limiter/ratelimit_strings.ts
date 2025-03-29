import { MAX_REQUESTS_PER_SECOND } from "$env/static/private";

export const generateNewRateLimiter = (): string => {
    return "1@" + Date.now().toString();
}

export const isEligibleResetLimiter = (decryptedCookieString: string): boolean => {
    const lastRequestDate: number = Number.parseInt(decryptedCookieString.split("@")[1]);
    
    return (Date.now() - lastRequestDate) >= 1000;
}

export const newRequestOccured = (decryptedCookieString: string): string => {
    let requestsAmount: number = Number.parseInt(decryptedCookieString.split("@")[0]);
    requestsAmount++;

    return requestsAmount + "@" + Date.now().toString();
}

export const isEligibaleToRequest = (decryptedCookieString: string): boolean => {
    const requestParts: string[] = decryptedCookieString.split("@");

    const requestsAmount: number = Number.parseInt(requestParts[0]);
    const lastRequestDate: number = Number.parseInt(requestParts[1]);

    return (requestsAmount <= Number.parseInt(MAX_REQUESTS_PER_SECOND) && (Date.now() - lastRequestDate) >= 1000);
}