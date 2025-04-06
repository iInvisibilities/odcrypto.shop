import { getAllLiveTransactions } from "$lib/server/cache/cache_man/live_transactions";
import { json } from "@sveltejs/kit";

export const GET = async ({ locals }) => {
    const auth = await locals.auth();
    if (!auth) return new Response('Unauthorized!', { status: 401 });
    const is_super = (auth.user as Record<string, any>).is_super;

    if (!is_super) return json({});
    const live_transactions = await getAllLiveTransactions();

    return json({ live_transactions });
}