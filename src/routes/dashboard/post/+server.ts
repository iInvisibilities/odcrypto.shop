import { File } from 'buffer';
import { upload_to_user_bucket } from '$lib/server/cloud_storage/minio_man/upto_bucket.js';

export const POST = async ({ request, locals }): Promise<Response> => {
	const session = await locals.auth();
	const form_data = await request.formData();

	if (!session || !session.user?.id) {
		return new Response('Unauthorized!', { status: 401 });
	}
	const file = form_data.get('file');
	if (!file || !(file instanceof File)) {
		return new Response('Missing form data!', { status: 400 });
	}

	await upload_to_user_bucket(session.user?.id, file);

	return new Response('');
};
