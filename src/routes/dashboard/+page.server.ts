import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';
import { getProduct } from '$lib/server/database/db_man/products';
import {
	deleteEstablishedRelationship,
	getRelationshipsHolderOf
} from '$lib/server/database/db_man/object_relationships';

export const ssr = true;

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();

	if (!session || !session.user?.id) redirect(303, `/`);

	const user_product_relationships = await getRelationshipsHolderOf(session.user?.id ?? '');
	if (user_product_relationships == null) return {};

	return {
		relations: user_product_relationships.relations.map(async (rlp) => {
			if (!rlp.object_id) return null;

			const product = await getProduct(rlp.object_id?.toString());
			if (!product || (rlp.relationship_type == 'WISHLISTED' && product.deleted)) {
				await deleteEstablishedRelationship(
					session.user?.id ?? '',
					rlp.object_id?.toString(),
					rlp.relationship_type
				);
				return;
			}
			return {
				...rlp,
				product: { ...product, _id: rlp.object_id.toString() ?? '' },
				product_id: rlp.object_id.toString() ?? ''
			};
		})
	};
};
