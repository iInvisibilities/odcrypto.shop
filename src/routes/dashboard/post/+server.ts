import { requestUpload } from '$lib/server/cloud_storage/minio_man/upto_bucket';
import {
	establishRelationship,
	getRelationshipsHolderOf
} from '$lib/server/database/db_man/object_relationships';
import { createProduct, updateProduct } from '$lib/server/database/db_man/products.js';
import type { EPInformation, ProductPost } from '$lib/types/product';
import { json } from '@sveltejs/kit';

export const POST = async ({ request, locals }): Promise<Response> => {
	const session = await locals.auth();

	// ADD WALLET ADDRESS AND ICON URL
	const { product } = await request.json();

	if (!session || !session.user?.id) {
		return new Response('Unauthorized!', { status: 401 });
	}

	if (
		!product.name ||
		!product.description ||
		!product.price ||
		!product.currency ||
		!product.file_name ||
		!product.wallet_id ||
		(<string>product.currency).length > 3 ||
		(<string>product.currency).length < 0
	) {
		return new Response('Bad request!', { status: 400 });
	}

	const user_id = session.user?.id;

	const created_prod = await createProduct({
		name: product.name,
		description: product.description,
		price: product.price,
		currency: product.currency,
		file_name: user_id + '/' + product.file_name,
		bought_how_many_times: 0,
		wallet_id: product.wallet_id
	});

	await establishRelationship(user_id, {
		object_id: created_prod._id,
		relationship_type: 'POSTED',
		established_at: new Date()
	});

	const signedUploadURL = await requestUpload(user_id, product.file_name);

	return json({ signed_url: signedUploadURL });
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

	// ADD MORE CHECKS
	if (!check_price(updated_info)) {
		return new Response('Invalid pricing information.', { status: 400 });
	}

	if (!check_naming(updated_info)) {
		return new Response('Name or description too long. (32 and 256 characters)', { status: 400 });
	}

	if (!check_icon_url(updated_info)) {
		return new Response('Invalid icon URL (must use HTTPS)', { status: 400 });
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

const check_icon_url = (updated_info: EPInformation): boolean => {
	return (
		updated_info.icon_url == undefined ||
		(updated_info.icon_url != undefined &&
			updated_info.icon_url?.length <= 256 &&
			updated_info.icon_url.match(
				'https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)'
			) != null)
	);
};

const check_naming = (updated_info: EPInformation): boolean => {
	return updated_info.name.length <= 32 && updated_info.description.length <= 256;
};

const check_price = (updated_info: EPInformation): boolean => {
	return !isNaN(updated_info.price) && updated_info.price > 0 && updated_info.currency.length <= 3;
};
