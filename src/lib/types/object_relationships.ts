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

export type SERRelationshipHolder = {
	_id?: string;
	user_id: string;
	relations: Relationship[];
};

export type SERRelationship = {
	relationship_type: RelationshipType;
	object_id?: string;
	established_at: Date;
};
