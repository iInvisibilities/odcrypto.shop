import { COINBASE_API_KEY } from '$env/static/private';
import { requestUpload } from '$lib/server/cloud_storage/minio_man/upto_bucket';
import {
	establishRelationship,
	getRelationshipsHolderOf
} from '$lib/server/database/db_man/object_relationships';
import { createProduct, updateProduct } from '$lib/server/database/db_man/products.js';
import { createWalletObj, getWallet } from '$lib/server/database/db_man/wallets.js';
import type { Relationship, SERRelationship } from '$lib/types/object_relationships.js';
import type { EPInformation, ProductPost } from '$lib/types/product';
import { json } from '@sveltejs/kit';
import { hasAllFields } from '$lib/util/TSUtil';

const URL_REG =
	/^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;

export const POST = async ({ request, locals, fetch }): Promise<Response> => {
	const session = await locals.auth();

	let { object_type, object } = (await request.json()) as {
		object_type: string;
		object: ProductPost | { address: string; type: string };
	};

	if (!session || !session.user?.id) {
		return new Response('Unauthorized!', { status: 401 });
	}

	if (object_type == 'PRODUCT') {
		object = object as ProductPost;
		if (
			!hasAllFields<ProductPost>(object, [
				'name',
				'description',
				'price',
				'currency',
				'file_name',
				'wallet_id'
			])
		) {
			return new Response('Bad request!', { status: 400 });
		}

		if (!check_price(object)) {
			return new Response('Invalid pricing information.', { status: 400 });
		}

		if (!check_naming(object)) {
			return new Response('Name or description too long. (32 and 256 characters)', { status: 400 });
		}

		if (!check_icon_url(object)) {
			return new Response('Invalid icon URL (must use HTTPS)', { status: 400 });
		}

		if (!(await check_wallet_address(object))) {
			return new Response('Invalid wallet address.', { status: 400 });
		}

		const user_id = session.user?.id;

		const created_prod = await createProduct({
			name: object.name,
			description: object.description,
			price: object.price,
			currency: object.currency,
			file_name: user_id + '/' + object.file_name,
			bought_how_many_times: 0,
			wallet_id: object.wallet_id,
			icon_url: object.icon_url
		});

		await establishRelationship(user_id, {
			object_id: created_prod._id,
			relationship_type: 'POSTED',
			established_at: new Date()
		});

		const signedUploadURL = await requestUpload(user_id, object.file_name);

		return json({ signed_url: signedUploadURL });
	} else if (object_type == 'WALLET') {
		object = object as { address: string; type: string };

		if (!object.address || !object.type) {
			return new Response('Bad request!', { status: 400 });
		}

		const currency_type_test = await fetch(
			'https://api.exchange.coinbase.com/currencies/' + object.type,
			{
				headers: {
					'X-CC-Api-Key': COINBASE_API_KEY
				}
			}
		);

		if (currency_type_test.status != 200) {
			return new Response('Invalid currency type!', { status: 400 });
		}

		// CHANGE API TO A MORE RELIABLE ONE
		/*const crypto_address_test = await fetch(
			'https://api.checkcryptoaddress.com/addresses/' + object.address
		);
		const response = await crypto_address_test.json();
		if (response.networks.length == 0) {
			return new Response('Invalid address!', { status: 400 });
		}*/
		const crypto_address_test = await fetch(
			'https://app.zerion.io/zpi/wallet/get-meta/v1?identifiers=' + object.address,
			{
				headers: {
					'zerion-client-type': 'web',
					'zerion-client-version': '1.145.1'
				}
			}
		);
		const response = await crypto_address_test.json();
		if (!response.data) {
			return new Response('Invalid address!', { status: 400 });
		}

		const user_id = session.user?.id;

		const created_wallet = await createWalletObj({
			address: object.address,
			type: (object.type as String).toUpperCase()
		});

		const newly_established_rlp: Relationship = {
			object_id: created_wallet._id,
			relationship_type: 'WALLET',
			established_at: new Date()
		};
		await establishRelationship(user_id, newly_established_rlp);

		const serializable_established_rlp: SERRelationship = {
			object_id: created_wallet._id?.toString() ?? '',
			relationship_type: 'WALLET',
			established_at: newly_established_rlp.established_at
		};

		return json({ serializable_established_rlp, wallet_id: created_wallet._id?.toString() ?? '' });
	}

	return new Response("Couldn't understand object_type!", { status: 400 });
};

export const PATCH = async ({ request, locals }): Promise<Response> => {
	const session = await locals.auth();
	const { updated_info } = (await request.json()) as { updated_info: EPInformation };

	if (!session || !session.user?.id) {
		return new Response('Unauthorized!', { status: 401 });
	}

	if (!updated_info) {
		return new Response('No information provided!', { status: 400 });
	}

	const currentOwnedProducts = await getRelationshipsHolderOf(session.user?.id ?? '');
	if (
		!currentOwnedProducts?.relations.find(
			(rlp) =>
				rlp.object_id?.toString() == updated_info.product_id && rlp.relationship_type == 'POSTED'
		)
	) {
		return new Response('You do not own this product!', { status: 401 });
	}

	if (!updated_info.product_id) {
		return new Response('No product id provided!', { status: 400 });
	}

	if (!check_price(updated_info)) {
		return new Response('Invalid pricing information.', { status: 400 });
	}

	if (!check_naming(updated_info)) {
		return new Response('Name or description too long. (32 and 256 characters)', { status: 400 });
	}

	if (!check_icon_url(updated_info)) {
		return new Response('Invalid icon URL (must use HTTPS)', { status: 400 });
	}

	if (!(await check_wallet_address(updated_info))) {
		return new Response('Invalid wallet address.', { status: 400 });
	}

	const safe_info_to_update = {
		name: updated_info.name,
		description: updated_info.description,
		price: updated_info.price,
		currency: updated_info.currency,
		icon_url: updated_info.icon_url,
		wallet_id: updated_info.wallet_id
	};

	await updateProduct(updated_info.product_id, safe_info_to_update);

	return new Response('Updated successfully!', { status: 200 });
};

const check_icon_url = (updated_info: EPInformation | ProductPost): boolean => {
	return (
		!updated_info.icon_url ||
		updated_info.icon_url.trim() == '' ||
		(!!updated_info.icon_url &&
			updated_info.icon_url?.length <= 256 &&
			URL_REG.test(updated_info.icon_url))
	);
};

const check_naming = (updated_info: EPInformation | ProductPost): boolean => {
	return updated_info.name.length <= 32 && updated_info.description.length <= 256;
};

const check_price = (updated_info: EPInformation | ProductPost): boolean => {
	return !isNaN(updated_info.price) && updated_info.price > 0 && updated_info.currency.length <= 3;
};

const check_wallet_address = async (
	updated_info: EPInformation | ProductPost
): Promise<boolean> => {
	if (!updated_info.wallet_id) return false;
	const supposedWallet = await getWallet(updated_info.wallet_id);

	return supposedWallet != null;
};
