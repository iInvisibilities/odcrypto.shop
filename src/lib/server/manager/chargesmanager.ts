import type { LiveTransaction } from '$lib/types/transaction';
import { ObjectId } from 'mongodb';
import { deleteLiveTransaction, getLiveTransaction } from '../cache/cache_man/live_transactions';
import { establishRelationship } from '../database/db_man/product_relationships';
import { incrementBoughtHowManyTimes } from '../database/db_man/products';

export const handleSuccessfulCharge = async (charge_id: string) => {
	const liveTransaction: LiveTransaction | null = await getLiveTransaction(charge_id);
	if (liveTransaction == null) return;
	const { user_id, product_id } = liveTransaction;

	await incrementBoughtHowManyTimes(product_id);

	await establishRelationship(user_id, {
		relationship_type: 'BOUGHT',
		product_id: new ObjectId(product_id),
		established_at: new Date()
	});

	await deleteLiveTransaction(charge_id);
};
