import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';
import { getProduct } from '$lib/server/database/db_man/products';
import {
	deleteEstablishedRelationship,
	getRelationshipsHolderOf
} from '$lib/server/database/db_man/object_relationships';
import { getWallet } from '$lib/server/database/db_man/wallets';
import type { Product, SERProduct } from '$lib/types/product';
import type { SERWallet, Wallet } from '$lib/types/wallet';
import type { SERRelationship } from '$lib/types/object_relationships';

export const ssr = true;

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();

	if (!session || !session.user?.id) redirect(303, `/`);

	const user_object_relationships = await getRelationshipsHolderOf(session.user?.id ?? '');
	if (!user_object_relationships) return { relations: [] };
	let relations: { rlp: SERRelationship; object: SERProduct | SERWallet | null }[] = [];
	user_object_relationships.relations.forEach(async (rlp) => {
		if (!rlp.object_id) return null;

		let object: SERProduct | SERWallet | null = null;
		if (rlp.relationship_type == 'WALLET') {
			let wallet_object = await getWallet(rlp.object_id?.toString());
			object = { ...wallet_object, _id: wallet_object?._id?.toString() } as SERWallet;
			if (!wallet_object) {
				await deleteEstablishedRelationship(
					session.user?.id ?? '',
					rlp.object_id?.toString(),
					rlp.relationship_type
				);
			}
		} else {
			let product_object = await getProduct(rlp.object_id?.toString());
			object = { ...product_object, _id: product_object?._id?.toString() } as SERProduct;
			if (!product_object || (rlp.relationship_type == 'WISHLISTED' && object.deleted)) {
				await deleteEstablishedRelationship(
					session.user?.id ?? '',
					rlp.object_id?.toString(),
					rlp.relationship_type
				);
			}
		}

		relations.push({
			rlp: { ...rlp, object_id: rlp.object_id.toString() } as SERRelationship,
			object
		});
	});
	return { relations };
};
