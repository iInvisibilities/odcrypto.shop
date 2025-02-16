import type { ObjectId } from 'mongodb';

export type Product = {
	_id?: ObjectId;
	name: string;
	description: string;
	price: number;
	currency: string;
	bought_how_many_times: number;
};

export type RelationshipType = 'BOUGHT' | 'POSTED' | 'WISHLISTED';

export type ProductRelationship = {
	relationship_type: RelationshipType;
	product_id: ObjectId;
	established_at: Date;
};

export type ProductRelationhipHolder = {
	_id?: ObjectId;
	user_id: ObjectId;
	relations: ProductRelationship[];
};
