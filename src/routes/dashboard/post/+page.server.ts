import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requestUpload } from '$lib/server/cloud_storage/minio_man/upto_bucket';

export const ssr = true;

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();

	if (!session || !session.user?.id) redirect(303, `/`);
};
