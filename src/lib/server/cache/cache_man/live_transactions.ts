import type { LiveTransaction } from '$lib/types/transaction';
import { REDIS_LIVETRANSACTION_SUFFIX } from '$env/static/private';
import client from '../redis';

const redis_key = (charge_id: string) => `${REDIS_LIVETRANSACTION_SUFFIX + charge_id}`;

export const getAllLiveTransactions = async (): Promise<LiveTransaction[]> => {
	const keys = await client.keys(`${REDIS_LIVETRANSACTION_SUFFIX}*`);
	const transactions: LiveTransaction[] = [];

	for (const key of keys) {
		const transaction = await client.get(key);
		const time_created = await client.get(key + ':time_created');

		if (transaction && time_created) {
			const parsedTransaction = JSON.parse(transaction);
			parsedTransaction.time_created = time_created;

			transactions.push(parsedTransaction);
		}
	}

	return transactions;
}

export const expectTransaction = async (charge_id: string, user_id: string, product_id: string) => {
	await client.set(redis_key(charge_id), JSON.stringify({ user_id, product_id }));
	await client.set(redis_key(charge_id) + ":time_created", Date.now());

	await client.expire(redis_key(charge_id), 60 * 60 * 2); // 2 hours
	await client.expire(redis_key(charge_id) + ":time_created", 60 * 60 * 2); // 2 hours
};

export const getLiveTransaction = async (charge_id: string): Promise<LiveTransaction | null> => {
	const transaction = await client.get(redis_key(charge_id));
	return transaction ? JSON.parse(transaction) : null;
};

export const deleteLiveTransaction = async (charge_id: string): Promise<void> => {
	await client.del(redis_key(charge_id));
	await client.del(redis_key(charge_id) + ":time_created");
};
