import { minioClient } from '../minio_client';

export const requestUpload = async (user_id: string, file_name: string): Promise<String> => {
	return await minioClient.presignedUrl('PUT', 'products', user_id + '/' + file_name, 1);
};

export const requestDownloadProduct = async (
	owner_id: string,
	product_filename: string
): Promise<String> => {
	return await minioClient.presignedGetObject('products', owner_id + '/' + product_filename, 1);
};

export const requestListAllProductsByUser = async (user_id: string): Promise<String> => {
	return await minioClient.presignedUrl('GET', 'products', user_id + '/*', 10);
};

export const requestDeleteProduct = async (owner_id: string, product_filename: string) => {
	await minioClient.removeObject('products', owner_id + '/' + product_filename);
};
/*
USE PRESIGNED URLS PROPERTY <- this looks more promising
OR:
PROGRAMATICALLY CREATE ACCESS KEYS WITH CUSTOMLY GENERATED POLICIES FOR EACH ACCESS KEY FOR EACH USER AND CREATE A BUCKET FOR THAT USER
AND STORE ACCESS KEY ID AND KEY PRIVATE IN BOTH DATABASE, AND COOKIE WHICH WILL BE ADDED IN THE AUTHJS MIDDLEWARE TO ACCESS
ONLY ALLOW THAT SPECIFIC USER TO UPLOAD TO A SPECIFIC BUCKET
*/
