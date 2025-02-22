import type { File } from 'buffer';
import { minioClient } from '../minio_client';

export const upload_to_user_bucket = async (user_id: string, file: File) => {
	const bucket = 'odcrypto-user-' + user_id;
	const destinationObject = file.name;

	const exists = await minioClient.bucketExists(bucket);
	if (!exists) await minioClient.makeBucket(bucket);

	var metaData = {
		'Content-Type': file.type,
		uploaded_at: new Date().toJSON()
	};

	const file_buff = Buffer.from(await file.arrayBuffer());

	await minioClient.putObject(bucket, destinationObject, file_buff, file.size, metaData);
};
