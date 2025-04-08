export type LiveTransaction = { user_id: string; product_id: string };
export type LiveTransactionWithUsernames = {
    user: { username: string, user_id: string },
    product: { product_id: string, product_name: string }
}[];