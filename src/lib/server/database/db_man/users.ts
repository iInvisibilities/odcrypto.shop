import type { User } from "@auth/sveltekit";
import client from "../mongodb";
import { MONGODB_NAME } from "$env/static/private";
import { ObjectId } from "mongodb";

const coll = client.db(MONGODB_NAME).collection<User>("users");

export async function getUsernameFromId(id: string) {
    const user = await coll.find({ _id: new ObjectId(id) }).project({ name: 1 }).next();
    return user;
}