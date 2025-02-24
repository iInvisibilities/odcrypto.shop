import { Client } from 'minio';
import { MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY } from '$env/static/private';

export let minioClient: Client;

export const connectMinioClient = () => {
	minioClient = new Client({
		endPoint: MINIO_ENDPOINT,
		port: 9000,
		useSSL: true,
		accessKey: MINIO_ACCESS_KEY,
		secretKey: MINIO_SECRET_KEY
	});
};
