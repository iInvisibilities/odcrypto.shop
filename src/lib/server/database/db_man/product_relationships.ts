import client from '../mongodb';
import { ObjectId } from 'mongodb';
import { MONGODB_NAME, MONGODB_PRODCUT_RELATIONSHIPS_COLLECTION } from '$env/static/private';
import type {
	ProductRelationhipHolder,
	ProductRelationship,
	RelationshipType
} from '$lib/types/product';

const coll = client
	.db(MONGODB_NAME)
	.collection<ProductRelationhipHolder>(MONGODB_PRODCUT_RELATIONSHIPS_COLLECTION);

export async function createRelationship(
	relationshipholder_object: ProductRelationhipHolder
): Promise<ProductRelationhipHolder> {
	const result = await coll.insertOne(relationshipholder_object);
	return { ...relationshipholder_object, _id: result.insertedId };
}

export async function getRelationshipsHolderOf(
	user_id: string
): Promise<ProductRelationhipHolder | null> {
	return await coll.findOne({ user_id: new ObjectId(user_id) });
}

export async function establishRelationship(
	user_id: string,
	relationship_obj: ProductRelationship
): Promise<void> {
	const relationships_holder = await getRelationshipsHolderOf(user_id);
	if (!relationships_holder) return;
	relationships_holder.relations.push(relationship_obj);

	await coll.updateOne({ user_id: new ObjectId(user_id) }, { $set: relationships_holder });
}

export async function deleteEstablishedRelationship(
	user_id: string,
	product_id: string,
	relationship_type: RelationshipType
): Promise<void> {
	const relationships_holder = await getRelationshipsHolderOf(user_id);
	if (!relationships_holder) return;
	relationships_holder.relations = relationships_holder.relations.filter(
		(rel) => rel.product_id.toString() !== product_id && rel.relationship_type !== relationship_type
	);

	await coll.updateOne({ user_id: new ObjectId(user_id) }, { $set: relationships_holder });
}

export async function getAllRelationshipsOfType(
	user_id: string,
	relationship_type: RelationshipType
): Promise<ProductRelationship[]> {
	const relationships_holder = await getRelationshipsHolderOf(user_id);
	if (!relationships_holder) return [];
	return relationships_holder.relations.filter(
		(rel) => rel.relationship_type === relationship_type
	);
}
