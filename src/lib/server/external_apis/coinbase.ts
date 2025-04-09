import { COINBASE_API_KEY, MAX_LIVE_TRANSACTIONS_PER_USER } from '$env/static/private';
import type { ProductDAO } from '$lib/types/product.js';
import { expectTransaction, findPurchaseUrl, getAmountOfLiveTransactionsOfUser, setPurchaseUrl } from '../cache/cache_man/live_transactions';

/**
 * @param product product to be sold
 * @returns payment url for customer
 */
export const createCharge = async (user_id: string, product: ProductDAO): Promise<string> => {
	const purchase_url = await findPurchaseUrl(user_id, product.id);
	if (purchase_url != null) return Promise.resolve(purchase_url);

	const currentLiveTransactions = await getAmountOfLiveTransactionsOfUser(user_id);
	if (currentLiveTransactions > Number.parseInt(MAX_LIVE_TRANSACTIONS_PER_USER)) {
		return Promise.reject('Too many transactions for this user in progress, please try again later');
	}

	const charge_obj = {
		name: product.name,
		description: product.description,
		pricing_type: 'fixed_price',
		local_price: {
			amount: product.price.toString(),
			currency: product.currency
		}
	};
	
	const charge_create = await fetch('https://api.commerce.coinbase.com/charges/', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-CC-Api-Key': COINBASE_API_KEY,
			'X-CC-Version': '2018-03-22'
		},
		body: JSON.stringify(charge_obj)
	});
	if (!charge_create.ok) return Promise.reject('Failed to create charge');

	const charge_data = (await charge_create.json()).data;
	const is_transaction_created = await expectTransaction(charge_data.id, user_id, product.id);
	if (!is_transaction_created) return Promise.reject('Too many transactions for this user in progress, please try again later');
	if (charge_data.hosted_url == null) return Promise.reject('Failed to create charge, no hosted url');

	await setPurchaseUrl(user_id, product.id, charge_data.hosted_url);
	return Promise.resolve(charge_data.hosted_url);
};
