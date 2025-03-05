import { requestUpload } from '$lib/server/cloud_storage/minio_man/upto_bucket';
import { establishRelationship } from '$lib/server/database/db_man/product_relationships.js';
import { createProduct } from '$lib/server/database/db_man/products.js';
import type { EPInformation } from '$lib/types/product';
import { json } from '@sveltejs/kit';

export const POST = async ({ request, locals }): Promise<Response> => {
	const session = await locals.auth();

	// ADD WALLET ADDRESS AND ICON URL
	const { product_name, product_description, product_price, product_price_currency, file_name } =
		await request.json();

	if (!session || !session.user?.id) {
		return new Response('Unauthorized!', { status: 401 });
	}

	if (
		!product_name ||
		!product_description ||
		!product_price ||
		!product_price_currency ||
		!file_name ||
		(<string>product_price_currency).length > 3
	) {
		return new Response('Bad request!', { status: 400 });
	}

	const user_id = session.user?.id;

	const created_prod = await createProduct({
		name: product_name,
		description: product_description,
		price: product_price,
		currency: product_price_currency,
		file_name: user_id + '/' + file_name,
		bought_how_many_times: 0
	});

	await establishRelationship(user_id, {
		product_id: created_prod._id,
		relationship_type: 'POSTED',
		established_at: new Date()
	});

	const signedUploadURL = await requestUpload(user_id, file_name);

	return json({ signed_url: signedUploadURL });
};

export const PATCH = async ({ request, locals }): Promise<Response> => {
	const session = await locals.auth();
	const { updated_info } = (await request.json()) as { updated_info: EPInformation };

	if (!session || !session.user?.id) {
		return new Response('Unauthorized!', { status: 401 });
	}

	if (!updated_info) {
		return new Response('Bad request!', { status: 400 });
	}

	if (updated_info.price < 0 || updated_info.currency.length > 3) {
		return new Response('Bad request!', { status: 400 });
	}

	// CHECK FOR DATA AND VALIDATE IT AND THEN UPDATE IT IN THE DATABASE

	return new Response('Updated successfully!', { status: 200 });
};
