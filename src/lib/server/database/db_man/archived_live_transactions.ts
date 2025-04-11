import type { LiveTransaction } from '$lib/types/transaction';
import client from '../mongodb';
import { MONGODB_NAME, MONGODB_ARCHIVED_LIVE_TRANSACTIONS_COLLECTION } from '$env/static/private';
import { ObjectId } from 'mongodb';

const coll = client
	.db(MONGODB_NAME)
	.collection<LiveTransaction>(MONGODB_ARCHIVED_LIVE_TRANSACTIONS_COLLECTION);

export async function archiveLiveTransaction(archived_live_transaction: LiveTransaction): Promise<LiveTransaction & { _id: ObjectId }> {
    const result = await coll.insertOne(archived_live_transaction);
    return { ...archived_live_transaction, _id: result.insertedId };
}

export async function getArchivedTransaction(_id: string): Promise<LiveTransaction & { _id: ObjectId } | null> {
    return await coll.findOne({ _id: new ObjectId(_id) });
}