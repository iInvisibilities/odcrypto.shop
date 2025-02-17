import { redirect } from '@sveltejs/kit';
import { getRelationshipsHolderOf } from '$lib/server/database/db_man/product_relationships';
import type { PageServerLoad } from './$types';

export const ssr = true;

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();

	if (session == null) redirect(303, `/`);

	console.log('from page ser', session.user);

	const user_product_relationships = await getRelationshipsHolderOf(session.user?.id ?? '');
	if (user_product_relationships == null) return {};

	return { relations: user_product_relationships.relations };
};
