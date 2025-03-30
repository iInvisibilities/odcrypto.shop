import { LOCAL_ICON_URLS_PREFIX } from "$env/static/private";
import { requestIconDownload } from "$lib/server/cloud_storage/minio_man/upto_bucket";
import { getAllRelationshipsOfType } from "$lib/server/database/db_man/object_relationships";
import { getProduct } from "$lib/server/database/db_man/products";
import type { Product, ProductPageObject } from "$lib/types/product";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "../$types";

export const load: PageServerLoad = async ({ params, locals }) => {
    const session = await locals.auth();
    if (!session || !session.user?.id) {
        redirect(301, "/");
        return;
    }

    const { product_id } = params as { product_id: string };
    
    const productObj = await getProduct(product_id);
    if (productObj == null) {
        redirect(308, "/");
        return;
    }

    let hasBought = !(await getAllRelationshipsOfType(session.user.id, "BOUGHT")).some((pred) => pred.object_id && productObj._id && pred.object_id.toString() == productObj._id.toString());
    let hasPosted = !(await getAllRelationshipsOfType(session.user.id, "POSTED")).some((pred) => pred.object_id && productObj._id && pred.object_id.toString() == productObj._id.toString());
    let hasWishlisted = !(await getAllRelationshipsOfType(session.user.id, "WISHLISTED")).some((pred) => pred.object_id && productObj._id && pred.object_id.toString() == productObj._id.toString());

    if (productObj.icon_url && productObj.icon_url.includes(LOCAL_ICON_URLS_PREFIX)) {
        const newIconUrl = await requestIconDownload(productObj.icon_url.replace(LOCAL_ICON_URLS_PREFIX, ""));
        productObj.icon_url = newIconUrl;
    }

    return { hasBought, hasPosted, hasWishlisted, productObject: {...productObj, _id: undefined, wallet_id: undefined, file_name: undefined } as Product & { _id?: undefined, wallet_id: undefined, file_name: undefined } } as ProductPageObject;
};