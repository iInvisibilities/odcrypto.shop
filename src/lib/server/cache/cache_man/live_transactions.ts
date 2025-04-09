import type { LiveTransaction } from '$lib/types/transaction';
import { MAX_LIVE_TRANSACTIONS_PER_USER, REDIS_LIVETRANSACTION_EXPIRE, REDIS_LIVETRANSACTION_SUFFIX } from '$env/static/private';
import client from '../redis';

const redis_key = (charge_id: string) => `${REDIS_LIVETRANSACTION_SUFFIX + charge_id}`;
const user_key = (user_id: string) => `${"user:" + user_id}`;
const purchase_url_key = (user_id: string, product_id: string) => `${"purchase_url:" + user_id + ":" + product_id}`;

export const findPurchaseUrl = async (user_id: string, product_id: string): Promise<string | null> => {
	return await client.get(purchase_url_key(user_id, product_id));
}

export const setPurchaseUrl = async (user_id: string, product_id: string, purchase_url: string): Promise<void> => {
	await client.set(purchase_url_key(user_id, product_id), purchase_url);
	await client.expire(purchase_url_key(user_id, product_id), Number.parseInt(REDIS_LIVETRANSACTION_EXPIRE)); // 2 hours
}

export const getAmountOfLiveTransactionsOfUser = async (user_id: string): Promise<number> => {
	return Number.parseInt(await client.get(user_key(user_id)) ?? "0");
}

export const getAllLiveTransactions = async (): Promise<LiveTransaction[]> => {
	const keys = await client.keys(`${REDIS_LIVETRANSACTION_SUFFIX}*`);
	const transactions: LiveTransaction[] = [];

	for (const key of keys) {
		const transaction = await client.get(key);

		if (transaction) {
			const parsedTransaction = JSON.parse(transaction);

			transactions.push(parsedTransaction);
		}
	}

	return transactions;
}

export const expectTransaction = async (charge_id: string, user_id: string, product_id: string): Promise<boolean> => {
	const currentLiveTransactions = await getAmountOfLiveTransactionsOfUser(user_id);
	if (currentLiveTransactions > Number.parseInt(MAX_LIVE_TRANSACTIONS_PER_USER)) return false;

	await client.set(redis_key(charge_id), JSON.stringify({ user_id, product_id, time_created: Date.now() }));
	await client.set(user_key(user_id), String(currentLiveTransactions + 1));

	await client.expire(redis_key(charge_id), Number.parseInt(REDIS_LIVETRANSACTION_EXPIRE)); // 2 hours
	await client.expire(user_key(user_id), Number.parseInt(REDIS_LIVETRANSACTION_EXPIRE)); // 2 hours

	return true;
};

export const getLiveTransaction = async (charge_id: string): Promise<LiveTransaction | null> => {
	const transaction = await client.get(redis_key(charge_id));
	return transaction ? JSON.parse(transaction) : null;
};

export const deleteLiveTransaction = async (charge_id: string, user_id: string): Promise<void> => {
	await client.del(redis_key(charge_id));

	const user_am = await client.get(user_key(user_id));
	if (user_am) {
		const new_am = Number.parseInt(user_am) - 1;
		if (new_am > 0) await client.set(user_key(user_id), String(new_am));
		else await client.del(user_key(user_id));
	}
};
