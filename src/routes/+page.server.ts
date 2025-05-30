import type { PageServerLoad } from './$types';

export const ssr = true;

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();

	return { session };
};
