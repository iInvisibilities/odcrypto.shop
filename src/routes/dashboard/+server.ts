import { getAllLiveTransactions } from "$lib/server/cache/cache_man/live_transactions";
import { getProduct_specific } from "$lib/server/database/db_man/products.js";
import { getUsernameFromId } from "$lib/server/database/db_man/users";
import type { LiveTransaction, LiveTransactionWithUsernames } from "$lib/types/transaction";
import { json } from "@sveltejs/kit";

export const GET = async ({ locals }) => {
    const auth = await locals.auth();
    if (!auth) return new Response('Unauthorized!', { status: 401 });
    const is_super = (auth.user as Record<string, any>).is_super;
    if (!is_super) return json({});

    const live_transactions:LiveTransaction[] = await getAllLiveTransactions();
    const live_transactions_with_usernames: LiveTransactionWithUsernames = [];

    for (const live_transaction_index in live_transactions) {
        const transaction = live_transactions[live_transaction_index];

        const user = await getUsernameFromId(transaction.user_id);
        const product = await getProduct_specific(transaction.product_id, { name: 1 });
        
        if (user != null && product != null) {
            live_transactions_with_usernames.push({
                user: { user_id: transaction.user_id, username: user.name ?? "" },
                product: { product_id: transaction.product_id, product_name: product.name },
                time_created: transaction.time_created
            });
        }
    }

    return json({ live_transactions_with_usernames });
}