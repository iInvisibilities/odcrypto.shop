import type { ObjectId } from 'mongodb';

export type Wallet = {
	_id?: ObjectId;
	address: string;
	type: string;
};

export type SERWallet = {
	_id?: string;
	address: string;
	type: string;
};
