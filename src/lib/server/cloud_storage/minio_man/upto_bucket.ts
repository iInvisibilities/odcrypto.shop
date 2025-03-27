import { minioClient } from '../minio_client';

/**
 * @param user_id Owner id
 * @param file_name Product file name
 * @returns A presigned URL
 */
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
 * @param user_id Owner id
 * @param file_name Icon file name
 * @returns A presigned URL
 */
export const requestIconUpload = async (user_id: string, file_name: string): Promise<String> => {
	return await minioClient.presignedUrl('PUT', 'icons', user_id + '/' + file_name, 60);
}

/**
 * @param icon_filename Icon file name with the user_id included seperating the actual file name with a /
 * @returns A presigned URL
 */
export const requestIconDownload = async (icon_filename: string): Promise<string> => {
	return await minioClient.presignedGetObject('icons', icon_filename, 60);
}

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
