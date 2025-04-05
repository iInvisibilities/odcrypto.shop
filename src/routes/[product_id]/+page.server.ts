import { LOCAL_ICON_URLS_PREFIX } from "$env/static/private";
import { requestIconDownload } from "$lib/server/cloud_storage/minio_man/upto_bucket";
import { getAllRelationshipsOfType } from "$lib/server/database/db_man/object_relationships";
import { getProduct } from "$lib/server/database/db_man/products";
import type { Product, ProductPageObject } from "$lib/types/product";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "../$types";
import type { RelationshipType } from "$lib/types/object_relationships";

export const load: PageServerLoad = async ({ url, params, locals }) => {
    const session = await locals.auth();
    const isGuest = !session?.user?.id;

    const { product_id } = params as { product_id: string };
    
    const productObj = await getProduct(product_id);
    if (productObj == null) {
        redirect(308, "/");
    }

    if (url.searchParams.get("purchase") == "true") {
        if (!isGuest) {
            redirect(303, `/${product_id}/purchase`);
        } else redirect(307, "/");
        
    }

    let hasBought = undefined;
    let hasPosted = undefined;
    let hasWishlisted = undefined;

    if (session?.user?.id) {
        hasBought = await hasRelationshipWithProduct(session.user.id, product_id, "BOUGHT");
        hasPosted = await hasRelationshipWithProduct(session.user.id, product_id, "POSTED");
        hasWishlisted = await hasRelationshipWithProduct(session.user.id, product_id, "WISHLISTED");
    }
    
    if (productObj.icon_url && productObj.icon_url.includes(LOCAL_ICON_URLS_PREFIX)) {
        const newIconUrl = await requestIconDownload(productObj.icon_url.replace(LOCAL_ICON_URLS_PREFIX, ""));
        productObj.icon_url = newIconUrl;
    }

    return { isGuest, hasBought, hasPosted, hasWishlisted, productObject: {...productObj, _id: undefined, wallet_id: undefined, file_name: undefined } as Product & { _id?: undefined, wallet_id: undefined, file_name: undefined } } as ProductPageObject;
};

const hasRelationshipWithProduct = async (userId: string, productId: string, relationshipType: RelationshipType) => {
    return (await getAllRelationshipsOfType(userId, relationshipType)).some((pred) => pred.object_id && pred.object_id.toString() == productId);
}