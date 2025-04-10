import { deleteLiveTransaction } from "$lib/server/cache/cache_man/live_transactions";
import { establishRelationship } from "$lib/server/database/db_man/object_relationships";
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

export const DELETE: RequestHandler = async ({ locals, request }) => {
	const auth = await locals.auth();
    if (!auth || !auth.user?.id) return new Response('Unauthorized!', { status: 401 });
    const is_super = (auth.user as Record<string, any>).is_super;
	if (!is_super) return new Response("Unauthorized!", { status: 401 });

	const { charge_id, user_id, product_id, reason } = await request.json();
	if (!product_id || !charge_id || !user_id || !reason || (reason as string).trim().length == 0) {
		return new Response("Bad request!", { status: 400 });
	}

	const del_op = await deleteLiveTransaction(charge_id, product_id, user_id);
	if (typeof del_op == "boolean" && !del_op) {
		return new Response("Bad request!", { status: 400 });
	}

	/*
	await establishRelationship(auth.user?.id, {
		relationship_type: "MODERATOR_OPERATION",
		object_id: undefined,
		object_type: "LIVE_TRANSACTION",
	});
	*/
	// MAKE THE OBJECT OF LIVE TRANSACTIONS IN THE MONGODB...
	return json({ deleted: true });
};