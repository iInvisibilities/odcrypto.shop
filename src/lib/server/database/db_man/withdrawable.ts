import client from "../mongodb";
import { MONGODB_NAME, MONGODB_USER_WITHDRAWABLES_COLLECTION } from "$env/static/private";
import type { UserWithdrawables, Withdrawable } from "$lib/types/withdrawable";

const coll = client.db(MONGODB_NAME).collection<UserWithdrawables>(MONGODB_USER_WITHDRAWABLES_COLLECTION);

export const getUserWithdrawables = async (user_id: string): Promise<UserWithdrawables | null> => {
    const userWithdrawables = await coll.findOne({ user_id });
    if (userWithdrawables == null) return null;
    return userWithdrawables;
}

export const addWithdrawable = async (user_id: string, withdrawable: Withdrawable): Promise<void> => {
    const userWithdrawables = await getUserWithdrawables(user_id);
    if (userWithdrawables == null) {
        await coll.insertOne({ user_id, withdrawables: [withdrawable] });
    } else {
        await coll.updateOne({ user_id }, { $push: { withdrawables: withdrawable } });
    }
}

export const getWithdrawableAmountOfCurrency = async (user_id: string, currency: string): Promise<number | null> => {
    const userWithdrawables = await getUserWithdrawables(user_id);
    if (userWithdrawables == null) return null;
    const withdrawable = userWithdrawables.withdrawables.find(w => w.currency === currency);
    if (withdrawable == null) return null;
    return withdrawable.amount;
}

export const setWithdrawableAmountOfCurrency = async (user_id: string, currency: string, amount: number): Promise<void> => {
    const userWithdrawables = await getUserWithdrawables(user_id);
    if (userWithdrawables == null) {
        await coll.insertOne({ user_id, withdrawables: [{ currency, amount }] });
    } else {
        await coll.updateOne({ user_id, "withdrawables.currency": currency }, { $set: { "withdrawables.$.amount": amount } });
    }
}