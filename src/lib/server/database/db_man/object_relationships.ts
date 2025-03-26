import { ObjectId } from 'mongodb';
import { MONGODB_NAME, MONGODB_RELATIONSHIPS_COLLECTION } from '$env/static/private';

import client from '../mongodb';
import type {
	RelationshipHolder,
	Relationship,
	RelationshipType
} from '$lib/types/object_relationships';

const coll = client
	.db(MONGODB_NAME)
	.collection<RelationshipHolder>(MONGODB_RELATIONSHIPS_COLLECTION);

export async function createRelationshipHolder(
	relationshipholder_object: RelationshipHolder
): Promise<RelationshipHolder> {
	const result = await coll.insertOne(relationshipholder_object);
	return { ...relationshipholder_object, _id: result.insertedId };
}

export async function getRelationshipsHolderOf(
	user_id: string
): Promise<RelationshipHolder | null> {
	return await coll.findOne({ user_id: new ObjectId(user_id) });
}

export async function establishRelationship(
	user_id: string,
	relationship_obj: Relationship
): Promise<void> {
	let relationships_holder = await getRelationshipsHolderOf(user_id);
	if (!relationships_holder) {
		relationships_holder = await createRelationshipHolder({
			user_id: new ObjectId(user_id),
			relations: []
		});
	}
	relationships_holder.relations.push(relationship_obj);
	relationships_holder.relations = relationships_holder.relations.sort(
		(rlp, rlp1) => rlp1.established_at.getTime() - rlp.established_at.getTime()
	);

	await coll.updateOne({ user_id: new ObjectId(user_id) }, { $set: relationships_holder });
}

export async function deleteAllEstablishedRelationshipsWithObject(
	user_id: string,
	obj_id: string
): Promise<void> {
	const relationships_holder = await getRelationshipsHolderOf(user_id);
	if (!relationships_holder) return;
	relationships_holder.relations = relationships_holder.relations.filter(
		(rel) => rel.object_id && rel.object_id.toString() != obj_id
	);

	await coll.updateOne({ user_id: new ObjectId(user_id) }, { $set: relationships_holder });
}

export async function getAllRelationshipsOfType(
	user_id: string,
	relationship_type: RelationshipType
): Promise<Relationship[]> {
	const relationships_holder = await getRelationshipsHolderOf(user_id);
	if (!relationships_holder) return [];
	return relationships_holder.relations.filter((rel) => rel.relationship_type == relationship_type);
}

export async function deleteEstablishedRelationship(
	user_id: string,
	obj_id: string,
	relationship_type: RelationshipType
): Promise<void> {
	const relationships_holder = await getRelationshipsHolderOf(user_id);
	if (!relationships_holder) return;
	relationships_holder.relations = relationships_holder.relations.filter(
		(rel) =>
			rel.object_id &&
			(rel.object_id.toString() != obj_id ||
				(rel.object_id.toString() == obj_id &&
					rel.relationship_type.toString() != relationship_type.toString()))
	);

	await coll.updateOne({ user_id: new ObjectId(user_id) }, { $set: relationships_holder });
}
