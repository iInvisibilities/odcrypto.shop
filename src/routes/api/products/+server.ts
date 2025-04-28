import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ locals }) => {
    const auth = await locals.auth();
    if(!auth?.user?.id) return new Response('Unauthorized!', { status: 401 });
    
    return new Response("", { status: 200 });
});