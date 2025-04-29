import { getProduct } from "$lib/server/database/db_man/products";
import type { Product, PublicProductObj } from "$lib/types/product";
import { error, json, type RequestHandler } from "@sveltejs/kit";

const PRODUCTS_PER_PAGE = 5;

export const POST: RequestHandler = async ({ request, locals, url }) => {
    const is_guest = !(await locals.auth())?.user?.id;
    const { products_of_user }: { products_of_user: string[] } = await request.json();
    const page = url.searchParams.get("page");
    let pageNumber: number | undefined;
    if (page == null || !isNumeric(page) || (pageNumber = parseInt(page)) < 0) error(400, "No page number specified!");

    let max_products_per_page = products_of_user.length;
    let starting_index = 0;

    if (products_of_user.length > PRODUCTS_PER_PAGE) {
        max_products_per_page = PRODUCTS_PER_PAGE * Math.floor(products_of_user.length / PRODUCTS_PER_PAGE);
        starting_index = max_products_per_page * pageNumber;
    }
    
    const products_to_be_returned:PublicProductObj[] = [];

    for (let index = starting_index; index < max_products_per_page; index++) {
        const next_product:Product | null = await getProduct(products_of_user[index]);
        if (next_product == null) error(400, "Cannot find product!");

        products_to_be_returned.push({ ...next_product, _id: undefined, wallet_id: undefined, file_name: undefined, posted_by: undefined } as PublicProductObj);
    }
    
    return json({ result: products_to_be_returned });
};

function isNumeric(value: string) {
    return /^\d+$/.test(value);
}