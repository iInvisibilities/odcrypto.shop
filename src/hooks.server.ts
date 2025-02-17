import { connectToMongoDB } from '$lib/server/database/mongodb';
import { connectToRedis } from '$lib/server/cache/redis';
import { MongoClient } from 'mongodb';

export { handle } from '$lib/server/manager/auth.js';

await connectToMongoDB();
await connectToRedis();
