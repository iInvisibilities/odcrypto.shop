import { createClient, type RedisClientType } from 'redis';
import { REDIS_CONN_URL } from '$env/static/private';

let client = createClient({ url: REDIS_CONN_URL });

client.on('error', (err) => console.log('Redis Client Error', err));

export default client;

export const connectToRedis = async () => {
	if (!client.isOpen) client = await client.connect();
};
