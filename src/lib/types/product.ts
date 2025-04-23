import type { ObjectId } from 'mongodb';

export type Product = {
	_id?: ObjectId;
	name: string;
	posted_by?: ObjectId;
	description: string;
	price: number;
	currency: string;
	file_name?: string;
	bought_how_many_times: number;
	icon_url?: string;
	wallet_id?: string;
	deleted?: boolean;
};

export type ProductPageObject =  { productObject: Product & { _id?: undefined, wallet_id?: undefined, file_name?: undefined, posted_by?: undefined }, isGuest: boolean, hasBought: boolean | undefined, hasPosted: boolean | undefined, hasWishlisted: boolean | undefined, posted_by: string | undefined };

export type SERProduct = Product & { _id: string, posted_by: string };

export type ProductPost = {
	name: string;
	description: string;
	price: number;
	currency: string;
	wallet_id: string;
	icon_url?: string;
	file_name: string;
};

export type ProductDAO = {
	id: string;
	name: string;
	description: string;
	price: number;
	currency: string;
	wallet_id: string;
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
