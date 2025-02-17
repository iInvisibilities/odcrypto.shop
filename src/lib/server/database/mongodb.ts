import { MongoClient, ServerApiVersion } from 'mongodb';
import { MONGODB_URI, NODE_ENV } from '$env/static/private';

if (!MONGODB_URI) {
	throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const options = {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true
	}
};

let client: MongoClient;

if (NODE_ENV === 'development') {
	let globalWithMongo = global as typeof globalThis & {
		_mongoClient?: MongoClient;
	};

	if (!globalWithMongo._mongoClient) {
		globalWithMongo._mongoClient = new MongoClient(MONGODB_URI, options);
	}
	client = globalWithMongo._mongoClient;
} else {
	client = new MongoClient(MONGODB_URI, options);
}

export default client;

export const connectToMongoDB = async () => (client = await client.connect());
