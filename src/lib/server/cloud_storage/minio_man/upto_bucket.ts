import { minioClient } from '../minio_client';

export const requestUpload = async (user_id: string, file_name: string): Promise<String> => {
	return await minioClient.presignedUrl('PUT', 'products', file_name, 3600, { prefix: user_id });
};

export const requestDownloadProduct = async (product_filename: string): Promise<String> => {
	// POSSIBILITY THAT ADDING THE PRODUCTS PREFIX IS NEEDED TO RETRIEVE THAT PRODUCT, SO MAYBE ADD THE OWNER_ID PARAM TO THIS FUNCTION, NEEDS TESTING
	return await minioClient.presignedGetObject('products', product_filename, 3600);
};

export const requestListAllProductsByUser = async (user_id: string): Promise<String> => {
	return await minioClient.presignedUrl('GET', 'products', '', 10, { prefix: user_id });
};

export const requestDeleteProduct = async (product_filename: string) => {
	// POSSIBILITY THAT ADDING THE PRODUCTS PREFIX IS NEEDED TO RETRIEVE THAT PRODUCT, SO MAYBE ADD THE OWNER_ID PARAM TO THIS FUNCTION, NEEDS TESTING

	await minioClient.removeObject('products', product_filename);
};
/*
USE PRESIGNED URLS PROPERTY <- this looks more promising
OR:
PROGRAMATICALLY CREATE ACCESS KEYS WITH CUSTOMLY GENERATED POLICIES FOR EACH ACCESS KEY FOR EACH USER AND CREATE A BUCKET FOR THAT USER
AND STORE ACCESS KEY ID AND KEY PRIVATE IN BOTH DATABASE, AND COOKIE WHICH WILL BE ADDED IN THE AUTHJS MIDDLEWARE TO ACCESS
ONLY ALLOW THAT SPECIFIC USER TO UPLOAD TO A SPECIFIC BUCKET
*/
