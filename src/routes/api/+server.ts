import { RequestHandler } from '@sveltejs/kit';

export const DELETE: RequestHandler = async ({ url, locals }) => {
	const auth = await locals.auth();
	if (!auth) {
		return new Response('Unauthorized!', { status: 401 });
	}
};
