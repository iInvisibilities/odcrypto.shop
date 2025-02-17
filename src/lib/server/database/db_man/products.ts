import { ObjectId } from 'mongodb';
import { MONGODB_NAME, MONGODB_PRODCUTS_COLLECTION } from '$env/static/private';
import type { Product } from '$lib/types/product';
import client from '../mongodb';

const coll = client.db(MONGODB_NAME).collection<Product>(MONGODB_PRODCUTS_COLLECTION);

export async function createProduct(product: Product): Promise<Product> {
	const result = await coll.insertOne(product);
	return { ...product, _id: result.insertedId };
}

export async function getProduct(id: string): Promise<Product | null> {
	return await coll.findOne({ _id: new ObjectId(id) });
}

export async function updateProduct(id: string, product: Partial<Product>): Promise<void> {
	await coll.updateOne({ _id: new ObjectId(id) }, { $set: product });
}

export async function deleteProduct(id: string): Promise<void> {
	await coll.deleteOne({ _id: new ObjectId(id) });
}

export async function incrementBoughtHowManyTimes(id: string): Promise<void> {
	await coll.updateOne({ _id: new ObjectId(id) }, { $inc: { bought_how_many_times: 1 } });
}
