import { COINBASE_API_KEY } from '$env/static/private';
import type { ProductDAO } from '$lib/types/product.js';
import { expectTransaction } from '../cache/cache_man/live_transactions';

/**
 * @param product product to be sold
 * @returns payment url for customer
 */
export const createCharge = async (user_id: string, product: ProductDAO): Promise<string> => {
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
	await expectTransaction(charge_data.id, user_id, product.id);
	
	return Promise.resolve(charge_data.hosted_url);
};
