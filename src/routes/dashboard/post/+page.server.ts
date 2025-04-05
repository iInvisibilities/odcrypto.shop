import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getWallet } from '$lib/server/database/db_man/wallets';
import type { SERWallet } from '$lib/types/wallet';
import { getAllRelationshipsOfType } from '$lib/server/database/db_man/object_relationships';

export const ssr = true;

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();

	if (!session || !session.user?.id) redirect(303, `/`);

	let user_wallets: SERWallet[] = [];
	const createdWalletsByUser = await getAllRelationshipsOfType(session.user.id, 'WALLET');
	for (const createdWallet in createdWalletsByUser) {
		const rlp = createdWalletsByUser[createdWallet];
		const wallet = await getWallet(rlp.object_id?.toString() ?? '');
		if (wallet != null) user_wallets.push({ ...wallet, _id: wallet._id?.toString() ?? '' } as SERWallet);
	}

	return { user_wallets };
};
