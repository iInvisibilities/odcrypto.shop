import { redirect } from '@sveltejs/kit';
import {
	deleteEstablishedRelationship,
	getRelationshipsHolderOf
} from '$lib/server/database/db_man/product_relationships';
import type { PageServerLoad } from './$types';
import { getProduct } from '$lib/server/database/db_man/products';
import type { fProduct, RelationshipType } from '$lib/types/product';

export const ssr = true;

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();

	if (!session || !session.user?.id) redirect(303, `/`);

	const user_product_relationships = await getRelationshipsHolderOf(session.user?.id ?? '');
	if (user_product_relationships == null) return {};

	return {
		relations: user_product_relationships.relations.map(async (rlp) => {
			if (!rlp.product_id) return null;

			const product = await getProduct(rlp.product_id?.toString());
			if (!product || (rlp.relationship_type == 'WISHLISTED' && product.deleted)) {
				await deleteEstablishedRelationship(
					session.user?.id ?? '',
					rlp.product_id?.toString(),
					rlp.relationship_type
				);
				return;
			}
			const fproduct: fProduct = (({ _id, ...product }) => product)(product);
			return {
				...rlp,
				product_id: rlp.product_id?.toString(),
				product: fproduct
			};
		})
	};
};
