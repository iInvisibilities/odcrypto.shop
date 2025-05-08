import { getWithdrawableAmountOfCurrency, setWithdrawableAmountOfCurrency } from "$lib/server/database/db_man/withdrawable";
import type { RequestHandler } from "@sveltejs/kit";
import { searchPriceAndCode } from "price-extractor";

export const POST:RequestHandler = async ({ request, locals }) => {
    const { amount, currency } = await request.json();
    const auth = await locals.auth();
    const user_id = auth?.user?.id;
    if (user_id == null) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    if (amount == null || isNaN(amount) || amount <= 0 || currency == null) {
        return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
    }
    const formattedPrice = searchPriceAndCode(amount.toString() + currency);
    if (formattedPrice.code == null || formattedPrice.price == null) {
        return new Response(JSON.stringify({ error: 'Invalid amount or currency' }), { status: 400 });
    }

    const withdrawable = await getWithdrawableAmountOfCurrency(user_id, currency);
    if (withdrawable == null) {
        return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    if (withdrawable < amount) {
        return new Response(JSON.stringify({ error: 'Insufficient funds' }), { status: 400 });
    }

    await setWithdrawableAmountOfCurrency(user_id, currency, withdrawable - amount);

    // send crypto transaction to the user

    return new Response(JSON.stringify({ success: true }), { status: 200 });
}