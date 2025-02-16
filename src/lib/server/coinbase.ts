import type { Product } from '$lib/types/product.js';

const coinbase_api_key: string = process.env.COINBASE_API_KEY ?? '';

/**
 * @param product product to be sold
 * @returns payment url for customer
 */
export const createCharge = async (product: Product): Promise<string> => {
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
			'X-CC-Api-Key': coinbase_api_key
		},
		body: JSON.stringify(charge_obj)
	});
	if (!charge_create.ok) return Promise.reject('FAILED TO CREATE CHARGE');

	const charge_data = await charge_create.json();

	return Promise.resolve(charge_data.hosted_url);
};
