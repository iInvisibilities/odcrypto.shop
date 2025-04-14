import type { ObjectId } from "mongodb";

export type Report = {
    _id?: ObjectId;
    user_id: string;
    object_id: string;
    reason: string;
    created_at: Date;
}