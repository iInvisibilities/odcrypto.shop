import { requestUpload } from '$lib/server/cloud_storage/minio_man/upto_bucket';
import { json } from '@sveltejs/kit';
import { File } from 'buffer';

export const POST = async ({ request, locals }): Promise<Response> => {
	const session = await locals.auth();
	const { file_name } = await request.json();

	if (!session || !session.user?.id) {
		return new Response('Unauthorized!', { status: 401 });
	}

	if (!file_name) {
		return new Response('Bad request!', { status: 400 });
	}

	const signedUploadURL = await requestUpload(session.user?.id, file_name);

	return json({ signed_url: signedUploadURL });
};
