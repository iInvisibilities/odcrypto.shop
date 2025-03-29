import { SvelteKitAuth } from '@auth/sveltekit';
import Coinbase from '@auth/sveltekit/providers/coinbase';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import Twitter from '@auth/sveltekit/providers/twitter';
import client from '../database/mongodb';
import { MONGODB_NAME } from '$env/static/private';

export const { handle, signIn, signOut } = SvelteKitAuth({
	providers: [Coinbase, Twitter],
	callbacks: {
		session({ session, user }) {
			session.user.id = user.id;
			return session;
		}
	},
	adapter: MongoDBAdapter(client, { databaseName: MONGODB_NAME })
});