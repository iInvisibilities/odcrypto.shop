import { SvelteKitAuth } from '@auth/sveltekit';
import Coinbase from '@auth/sveltekit/providers/coinbase';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import client from './database/mongodb';

export const { handle, signIn, signOut } = SvelteKitAuth({
	providers: [Coinbase],
	adapter: MongoDBAdapter(client)
});
