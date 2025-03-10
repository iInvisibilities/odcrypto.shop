import type { ObjectId } from 'mongodb';

export type Product = {
	_id?: ObjectId;
	name: string;
	description: string;
	price: number;
	currency: string;
	file_name: string;
	bought_how_many_times: number;
	icon_url?: string;
	wallet_id: string;
	deleted?: boolean;
};

export type ProductDAO = {
	id: string;
	name: string;
	description: string;
	price: number;
	currency: string;
};

export type EPInformation = {
	product_id: string;
	name: string;
	description: string;
	price: number;
	currency: string;
	icon_url?: string;
	wallet_id: string;
};
