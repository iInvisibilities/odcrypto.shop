import type { ObjectId } from "mongodb";
import type { ReportStatus } from "./moderator_actions";

export type Report = {
    _id?: ObjectId;
    status: ReportStatus;
    user_id: string;
    object_id: string;
    reason: string;
    created_at: Date;
}