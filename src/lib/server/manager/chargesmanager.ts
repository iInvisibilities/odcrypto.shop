import type { LiveTransaction } from '$lib/types/transaction';
import { ObjectId } from 'mongodb';
import { deleteLiveTransaction, getLiveTransaction } from '../cache/cache_man/live_transactions';
import { getProduct, incrementBoughtHowManyTimes } from '../database/db_man/products';
import { establishRelationship } from '../database/db_man/object_relationships';
import { getWallet } from '../database/db_man/wallets';
import { addWithdrawable, addWithdrawableAmountOfCurrency, getWithdrawableAmountOfCurrency, setWithdrawableAmountOfCurrency } from '../database/db_man/withdrawable';

export const handleSuccessfulCharge = async (charge_id: string) => {
	const liveTransaction: LiveTransaction | null = await getLiveTransaction(charge_id);
	if (liveTransaction == null) return;
	const { user_id, product_id } = liveTransaction;

	await incrementBoughtHowManyTimes(product_id);

	await establishRelationship(user_id, {
		relationship_type: 'BOUGHT',
		object_id: new ObjectId(product_id),
		established_at: new Date()
	});

	await deleteLiveTransaction(charge_id, product_id, user_id);

	const product = await getProduct(product_id);
	if (product == null || product.wallet_id == null) return;

	const wallet = await getWallet(product.wallet_id?.toString());
	if (wallet == null) return;
	const wallet_currency = wallet.type;

	await addWithdrawableAmountOfCurrency(user_id, wallet_currency, product.price);
};


