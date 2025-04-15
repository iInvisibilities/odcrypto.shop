import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import type { Report } from "$lib/types/reports";
import { createReport, deleteReport, getReportsOfObject, getReportsOfUser } from "$lib/server/database/db_man/reports";

export const GET: RequestHandler = async ({ url, locals }) => {
    const auth = await locals.auth();
    if (!auth) return new Response('Unauthorized!', { status: 401 });
    const sender_id = auth.user?.id;
    if (!sender_id) return new Response('Unauthorized!', { status: 401 });

    const is_super = (auth.user as Record<string, any>).is_super;
	if (!is_super) return new Response("Unauthorized!", { status: 401 });

    const object_id = url.searchParams.get('object_id');
    const user_id = url.searchParams.get('user_id');

    if (!object_id && !user_id) return new Response('Bad request!', { status: 400 });

    const reports: Report[] = [];
    let chosen_type: string = "";
    if (object_id) {
        chosen_type = "object";
        const reportsOfObject = await getReportsOfObject(object_id);
        reports.push(...reportsOfObject);
    }
    else if (user_id) {
        chosen_type = "user";
        const reportsOfUser = await getReportsOfUser(user_id);
        reports.push(...reportsOfUser);
    }


    return json({ chosen_type, reports });
}

export const POST: RequestHandler = async ({ request, locals }) => {
    const auth = await locals.auth();
    if (!auth) return new Response('Unauthorized!', { status: 401 });
    const sender_id = auth.user?.id;
    if (!sender_id) return new Response('Unauthorized!', { status: 401 });

    const { report }: { report: Report } = await request.json();
    if (!report) return new Response('Bad request!', { status: 400 });
    if (!report.reason || report.reason.trim().length == 0) return new Response('Bad request!', { status: 400 });
    if (!report.object_id) return new Response('Bad request!', { status: 400 });
    if (!report.user_id) return new Response('Bad request!', { status: 400 });

    report.user_id = sender_id;
    report.created_at = new Date();
    
    await createReport(report);
    return new Response('Reported!', { status: 200 });
}

export const DELETE: RequestHandler = async ({ request, locals }) => {
    const auth = await locals.auth();
    if (!auth) return new Response('Unauthorized!', { status: 401 });
    const sender_id = auth.user?.id;
    if (!sender_id) return new Response('Unauthorized!', { status: 401 });

    const is_super = (auth.user as Record<string, any>).is_super;
	if (!is_super) return new Response("Unauthorized!", { status: 401 });

    const { reports }: { reports: string[] } = await request.json();
    reports.forEach(async (report_id) => await deleteReport(report_id));

    return new Response('Deleted!', { status: 200 });
}