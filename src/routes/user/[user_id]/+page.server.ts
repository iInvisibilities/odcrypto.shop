import { error } from "@sveltejs/kit";
import type { PageServerLoad, PageServerLoadEvent } from "./$types";
import { getUserFromId } from "$lib/server/database/db_man/users";
import type { User } from "@auth/sveltekit";
import { getAllRelationshipsOfType } from "$lib/server/database/db_man/object_relationships";

export const ssr = true;
export const prerender = true;

export const load:PageServerLoad = async ({ locals, params }) => {
    const user_id = params.user_id;
    const user = await getUserFromId(user_id);
    if(!user) error(400, "Cannot find user!");

    const products_of_user: string[] = (await getAllRelationshipsOfType(user_id, "POSTED")).map(rlp => rlp.object_id?.toString() ?? "").filter(str => str.length != 0);
    const is_guest = (await locals.auth())?.user?.id == undefined;

    return { user: { ...user, email: undefined, _id: undefined }, is_guest, products_of_user, email: undefined } as 
    { user: User & { _id: undefined, email: undefined }, is_guest: boolean, products_of_user: string[] };
}