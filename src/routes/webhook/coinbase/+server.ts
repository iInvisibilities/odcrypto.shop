import { handleSuccessfulCharge } from '$lib/server/manager/chargesmanager.js';
import type { RequestHandler } from '@sveltejs/kit';
import crypto from 'node:crypto';

const coinbase_webhook_secret: string = process.env.COINBASE_WEBHOOK_SECRET ?? '';

export const POST: RequestHandler = async ({ request }) => {
	const webhook_signature = Buffer.from(
		request.headers.get('X-CC-WEBHOOK-SIGNATURE') ?? '',
		'utf-8'
	);
	const received_body = await request.text();
	const hmac = crypto.createHmac('sha256', coinbase_webhook_secret);

	const digest = Buffer.from(hmac.update(received_body).digest('hex'), 'utf8');
	if (
		webhook_signature.length !== digest.length ||
		!crypto.timingSafeEqual(digest, webhook_signature)
	) {
		return new Response('Invalid signature', { status: 401 });
	}

	const webhook_data = JSON.parse(received_body);
	const event = webhook_data.event;
	if (event.type == 'charge:pending') {
		const charge_id = event.data.id;
		await handleSuccessfulCharge(charge_id);
	}

	return new Response('OK', { status: 200 });
};
