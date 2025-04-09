export type LiveTransaction = { user_id: string; product_id: string, time_created: number };
export type LiveTransactionWithUsernames = {
    user: { username: string, user_id: string },
    product: { product_id: string, product_name: string },
    time_created: number
}[];