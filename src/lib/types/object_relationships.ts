import type { ObjectId } from 'mongodb';

export type RelationshipType = 'BOUGHT' | 'POSTED' | 'WISHLISTED' | 'WALLET';

export type Relationship = {
	relationship_type: RelationshipType;
	object_id?: ObjectId;
	established_at: Date;
};

export type RelationshipHolder = {
	_id?: ObjectId;
	user_id: ObjectId;
	relations: Relationship[];
};
