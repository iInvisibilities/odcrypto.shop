import type { User } from "@auth/sveltekit";
import client from "../mongodb";
import { MONGODB_NAME } from "$env/static/private";
import { ObjectId } from "mongodb";
import type { Document } from "mongodb";

const coll = client.db(MONGODB_NAME).collection<User>("users");

export const getUsernameFromId = async (id: string):Promise<User | null> => {
    const user = await coll.find({ _id: new ObjectId(id) }).project({ name: 1 }).next();
    return user;
}

export const findUsersWithName = async (name: string):Promise<Document[]> => {
    const users = await coll.find({ name: { $regex: name, $options: "i" } }).project({ name: 1 }).toArray();
    return users;
}

export const getUserFromId = async (id: string):Promise<User | null> => {
    const user = await coll.find({ _id: new ObjectId(id) }).next();
    return user;
}