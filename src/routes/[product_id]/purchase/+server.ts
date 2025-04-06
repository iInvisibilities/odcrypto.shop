import { error, redirect } from '@sveltejs/kit';
import { createCharge } from '$lib/server/external_apis/coinbase.js';
import type { ProductDAO } from '$lib/types/product.js';
import { getProduct } from '$lib/server/database/db_man/products';

export const GET = async ({ params, locals }) => {
    const { product_id } = params;

    const auth = await locals.auth();
    if (!auth) throw error(401, 'Unauthorized');

    const user_id = auth.user?.id;
    if (!user_id) throw error(401, 'Unauthorized');
    if (!product_id) throw error(400, 'Bad Request');

    const productObj = await getProduct(product_id);
    if (productObj == null) throw error(404, 'Product not found');

    const charge_url = await createCharge(user_id, {
        id: product_id,
        name: productObj.name,
        description: productObj.description,
        price: productObj.price,
        currency: productObj.currency,
        wallet_id: productObj.wallet_id
    } as ProductDAO);
    if (!charge_url) throw error(500, 'Failed to set up purchase page...');

    redirect(303, charge_url);
};