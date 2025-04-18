import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';
import { getProduct } from '$lib/server/database/db_man/products';
import {
	deleteEstablishedRelationship,
	getRelationshipsHolderOf
} from '$lib/server/database/db_man/object_relationships';
import { getWallet } from '$lib/server/database/db_man/wallets';
import type { SERProduct } from '$lib/types/product';
import type { SERWallet } from '$lib/types/wallet';
import type { SERRelationship } from '$lib/types/object_relationships';
import type { LiveTransaction } from '$lib/types/transaction';
import { getArchivedTransaction } from '$lib/server/database/db_man/archived_live_transactions';
import { getReport } from '$lib/server/database/db_man/reports';
import type { Report } from '$lib/types/reports';

export const ssr = true;

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();

	if (!session?.user?.id) redirect(303, `/`);

	const user_object_relationships = await getRelationshipsHolderOf(session.user?.id ?? '');
	if (!user_object_relationships) return { relations: [] };

	return {
		relations: user_object_relationships.relations.map(async (rlp) => {
			if (!rlp.object_id) return null;

			let object: SERProduct | SERWallet | LiveTransaction | Report | null;
			if (rlp.relationship_type == 'WALLET') {
				let wallet_object = await getWallet(rlp.object_id?.toString());
				if (!wallet_object) {
					await deleteEstablishedRelationship(
						session.user?.id ?? '',
						rlp.object_id?.toString() ?? '',
						rlp.relationship_type
					);
					object = null;
				} else object = { ...wallet_object, _id: wallet_object?._id?.toString() } as SERWallet;
			} 
			else if (rlp.relationship_type == "DEL_LIVE_TRANSACTION") {
				let live_transaction_object = await getArchivedTransaction(rlp.object_id?.toString());
				if (!live_transaction_object) {
					await deleteEstablishedRelationship(
						session.user?.id ?? '',
						rlp.object_id?.toString() ?? '',
						rlp.relationship_type
					);
					object = null;
				} else object = { ...live_transaction_object, _id: live_transaction_object?._id?.toString() } as LiveTransaction & { _id: string };
			}
			else if (rlp.relationship_type == "MANAGE_REPORT" || rlp.relationship_type == "POST_REPORT") {
				let report_object = await getReport(rlp.object_id?.toString());
				if (!report_object) {
					await deleteEstablishedRelationship(
						session.user?.id ?? '',
						rlp.object_id?.toString() ?? '',
						rlp.relationship_type
					);
					object = null;
				} else object = { ...report_object, _id: report_object?._id?.toString() } as Report & { _id: string };
			}
			else {
				let product_object = await getProduct(rlp.object_id?.toString());
				if (!product_object || (rlp.relationship_type == 'WISHLISTED' && product_object.deleted)) {
					await deleteEstablishedRelationship(
						session.user?.id ?? '',
						rlp.object_id?.toString() ?? '',
						rlp.relationship_type
					);
					object = null;
				} else object = { ...product_object, _id: product_object?._id?.toString() } as SERProduct;
			}

			return {
				rlp: { ...rlp, object_id: rlp.object_id.toString() } as SERRelationship,
				object: object as SERProduct | SERWallet | LiveTransaction & { _id: string },
			};
		})
	};
};
