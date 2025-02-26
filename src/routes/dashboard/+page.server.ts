import { redirect } from '@sveltejs/kit';
import { getRelationshipsHolderOf } from '$lib/server/database/db_man/product_relationships';
import type { PageServerLoad } from './$types';
import { getProduct } from '$lib/server/database/db_man/products';
import type { fProduct, RelationshipType } from '$lib/types/product';

export const ssr = true;

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();

	if (session == null) redirect(303, `/`);

	const user_product_relationships = await getRelationshipsHolderOf(session.user?.id ?? '');
	if (user_product_relationships == null) return {};

	const relations: {
		product_id: string | undefined;
		product: fProduct;
		relationship_type: RelationshipType;
		established_at: Date;
	}[] = [];

	user_product_relationships.relations.forEach(async (relation) => {
		const product = await getProduct(relation.product_id?.toString());
		if (!product) return;
		const fproduct: fProduct = (({ _id, ...product }) => product)(product);
		relations.push({ ...relation, product_id: relation.product_id?.toString(), product: fproduct });
	});

	return { relations };
};
