import { requestDownloadProduct } from '$lib/server/cloud_storage/minio_man/upto_bucket';
import {
	deleteEstablishedRelationship,
	getAllRelationshipsOfType
} from '$lib/server/database/db_man/object_relationships';
import { getProduct, markAsDeleted } from '$lib/server/database/db_man/products';
import { deleteWallet } from '$lib/server/database/db_man/wallets';
import { text, type RequestHandler } from '@sveltejs/kit';

export const DELETE: RequestHandler = async ({ url, locals }) => {
	const auth = await locals.auth();
	if (!auth) {
		return new Response('Unauthorized!', { status: 401 });
	}
	const user_id = auth.user?.id;
	if (!user_id) return new Response('Unauthorized!', { status: 401 });

	const is_wallet = url.searchParams.get('is_wallet');
	const type = url.searchParams.get('type');
	const object_id = url.searchParams.get('object_id');

	if ((!is_wallet && !type) || !object_id) return new Response('Bad request!', { status: 400 });
	if (!is_wallet) {
		if (type == 'POSTED') {
			const product = await getProduct(object_id);
			if (!product) return new Response('Bad request!', { status: 400 });
			const postedProdsOfUser = await getAllRelationshipsOfType(user_id, 'POSTED');
			if (
				!postedProdsOfUser.some(
					(pred) =>
						pred.object_id && product._id && pred.object_id.toString() == product._id.toString()
				)
			) {
				return new Response('Unauthorized!', { status: 401 });
			}

			await deleteEstablishedRelationship(user_id, object_id, 'POSTED');
			/*await deleteProduct(product_id);
			await requestDeleteProduct(product.file_name);
			*/
			await markAsDeleted(object_id);
		} else {
			await deleteEstablishedRelationship(user_id, object_id, 'WISHLISTED');
		}
	} else {
		await deleteEstablishedRelationship(user_id, object_id, 'WALLET');
		await deleteWallet(object_id);
	}

	return new Response('Deleted!', { status: 200 });
};

export const GET: RequestHandler = async ({ url, locals }) => {
	const auth = await locals.auth();
	if (!auth) {
		return new Response('Unauthorized!', { status: 401 });
	}
	const user_id = auth.user?.id;

	if (!user_id) return new Response('Unauthorized!', { status: 401 });

	const product_id = url.searchParams.get('product_id');

	if (!product_id) return new Response('Bad request!', { status: 400 });
	const product = await getProduct(product_id);
	if (!product) return new Response('Bad request!', { status: 400 });
	const boughtProdsOfUser = await getAllRelationshipsOfType(user_id, 'BOUGHT');
	const postedProdsOfUser = await getAllRelationshipsOfType(user_id, 'POSTED');

	if (
		!boughtProdsOfUser.some(
			(pred) => pred.object_id && product._id && pred.object_id.toString() == product._id.toString()
		) &&
		!postedProdsOfUser.some(
			(pred) => pred.object_id && product._id && pred.object_id.toString() == product._id.toString()
		)
	)
		return new Response('Unauthorized!', { status: 401 });

	const downloadURL: string = await requestDownloadProduct(product.file_name);

	return text(downloadURL);
};
