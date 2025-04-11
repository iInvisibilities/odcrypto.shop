import { deleteLiveTransaction, getLiveTransaction } from "$lib/server/cache/cache_man/live_transactions";
import { archiveLiveTransaction } from "$lib/server/database/db_man/archived_live_transactions";
import { establishRelationship } from "$lib/server/database/db_man/object_relationships";
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import type { LiveTransaction } from "$lib/types/transaction";

export const DELETE: RequestHandler = async ({ locals, request }) => {
	const auth = await locals.auth();
    if (!auth || !auth.user?.id) return new Response('Unauthorized!', { status: 401 });
    const is_super = (auth.user as Record<string, any>).is_super;
	if (!is_super) return new Response("Unauthorized!", { status: 401 });

	const { charge_id, user_id, product_id, reason } = await request.json();
	if (!product_id || !charge_id || !user_id || !reason || (reason as string).trim().length == 0) {
		return new Response("Bad request!", { status: 400 });
	}

	// archive the transaction
	const liveTransaction: LiveTransaction & { reason: string } | null = await getLiveTransaction(charge_id) as LiveTransaction & { reason: string };
	if (liveTransaction == null) return new Response("Bad request!", { status: 400 });
	liveTransaction.charge_id = charge_id;
	liveTransaction.reason = reason;
	const { _id } = await archiveLiveTransaction(liveTransaction);

	const del_op = await deleteLiveTransaction(charge_id, product_id, user_id);
	if (typeof del_op == "boolean" && !del_op) {
		return new Response("Bad request!", { status: 400 });
	}
	
	await establishRelationship(auth.user?.id, {
		relationship_type: "MODERATOR_ACTION",
		object_id: _id,
		established_at: new Date(Date.now()),
	});
	
	return json({ deleted: true });
};