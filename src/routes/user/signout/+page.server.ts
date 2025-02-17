import { signOut } from '$lib/server/manager/auth';
import type { Actions } from './$types';

export const actions: Actions = { default: signOut };
