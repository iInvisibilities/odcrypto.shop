import { connectToMongoDB } from '$lib/server/database/mongodb';
import { connectToRedis } from '$lib/server/cache/redis';

export { handle } from '$lib/server/manager/auth';

await connectToMongoDB();
await connectToRedis();
