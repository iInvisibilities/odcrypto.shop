import { signIn } from '$lib/server/manager/auth';
import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = { default: signIn };
export const load = async () => redirect(303, `/`);
