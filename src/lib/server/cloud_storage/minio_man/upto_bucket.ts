import { minioClient } from '../minio_client';

export const requestUpload = async (user_id: string, file_name: string): Promise<String> => {
	return await minioClient.presignedUrl('PUT', 'products', user_id + '/' + file_name, 60);
};

/**
 * @param product_filename Owner id must be included in the product' file name seperated with a "/" indicating it as the prefix
 * @returns A presigned URL
 */
export const requestDownloadProduct = async (product_filename: string): Promise<string> => {
	return await minioClient.presignedGetObject('products', product_filename, 60);
};

/**
 * @param product_filename Owner id must be included in the product' file name seperated with a "/" indicating it as the prefix
 * @returns A presigned URL
 */
export const requestDeleteProduct = async (product_filename: string) => {
	await minioClient.removeObject('products', product_filename);
};
/*
USE PRESIGNED URLS PROPERTY <- this looks more promising
OR:
PROGRAMATICALLY CREATE ACCESS KEYS WITH CUSTOMLY GENERATED POLICIES FOR EACH ACCESS KEY FOR EACH USER AND CREATE A BUCKET FOR THAT USER
AND STORE ACCESS KEY ID AND KEY PRIVATE IN BOTH DATABASE, AND COOKIE WHICH WILL BE ADDED IN THE AUTHJS MIDDLEWARE TO ACCESS
ONLY ALLOW THAT SPECIFIC USER TO UPLOAD TO A SPECIFIC BUCKET
*/
