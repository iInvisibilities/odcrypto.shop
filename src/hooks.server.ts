import { connectToMongoDB } from '$lib/server/database/mongodb';
import { connectToRedis } from '$lib/server/cache/redis';
import { connectMinioClient } from '$lib/server/cloud_storage/minio_client';

export { handle } from '$lib/server/manager/auth';

await connectToMongoDB();
await connectToRedis();
connectMinioClient();
