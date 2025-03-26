import { ObjectId } from 'mongodb';
import { MONGODB_NAME, MONGODB_CRYTPTO_WALLETS_COLLECTION } from '$env/static/private';
import client from '../mongodb';
import type { Wallet } from '$lib/types/wallet';

const coll = client.db(MONGODB_NAME).collection<Wallet>(MONGODB_CRYTPTO_WALLETS_COLLECTION);

export async function createWalletObj(wallet: Wallet): Promise<Wallet> {
	const result = await coll.insertOne(wallet);
	return { ...wallet, _id: result.insertedId };
}

export async function getWallet(id: string | undefined): Promise<Wallet | null> {
	if (!id) return null;
	return await coll.findOne({ _id: new ObjectId(id) });
}

export async function updateWalletInfo(id: string, wallet: Partial<Wallet>): Promise<void> {
	await coll.updateOne({ _id: new ObjectId(id) }, { $set: wallet });
}

export async function deleteWallet(id: string): Promise<void> {
	await coll.deleteOne({ _id: new ObjectId(id) });
}
