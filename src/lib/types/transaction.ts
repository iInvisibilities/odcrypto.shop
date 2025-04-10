export type LiveTransaction = { charge_id: string, user_id: string; product_id: string, time_created: number };
export type LiveTransactionWithUsernames = {
    charge_id: string,
    user: { username: string, user_id: string },
    product: { product_id: string, product_name: string },
    time_created: number
}[];