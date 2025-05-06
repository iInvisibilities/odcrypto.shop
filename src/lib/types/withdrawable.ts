import type { ObjectId } from "mongodb";

export type UserWithdrawables = {
    _id?: ObjectId;
    user_id: string;
    withdrawables: Withdrawable[];
}

export type Withdrawable = {
    amount: number;
    currency: string;
}