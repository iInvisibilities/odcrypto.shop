import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import type { Report } from "$lib/types/reports";
import { createReport, deleteReport, getReport, getReportsOfObject, getReportsOfUser, markReportAs } from "$lib/server/database/db_man/reports";
import { establishRelationship } from "$lib/server/database/db_man/object_relationships";
import { ManageReportType } from "$lib/types/moderator_actions";
import { getProduct } from "$lib/server/database/db_man/products";
import { ObjectId } from "mongodb";

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

export const POST: RequestHandler = async ({ request, locals, url }) => {
    const auth = await locals.auth();
    if (!auth) return new Response('Unauthorized!', { status: 401 });
    const sender_id = auth.user?.id;
    if (!sender_id) return new Response('Unauthorized!', { status: 401 });

    const is_super_command = url.searchParams.get('admin_command');
    const command:string | null = url.searchParams.get('command');
    if(is_super_command) {
        if (!command) return new Response('No command specified!', { status: 400 });
        if (!command.trim().length) return new Response('No command specified!', { status: 400 });

        const is_super = (auth.user as Record<string, any>).is_super;
        if (!is_super) return new Response("Unauthorized!", { status: 401 });
        
        if (command in ManageReportType) {
            const { report_id } = await request.json();
            if (!report_id) return new Response('Bad request!', { status: 400 });
            if (!ObjectId.isValid(report_id)) return new Response('Bad report id!', { status: 400 });
            
            const report = await getReport(report_id);
            if (!report) return new Response('Report not found!', { status: 400 });

            if (command == ManageReportType.DELETE_REPORT) {
                const is_deleted = await deleteReport(report_id);
                return new Response(is_deleted ? 'Deleted!' : 'Not deleted.', { status: 200 });
            }
            else if (command == ManageReportType.MARK_AS_DEALT_WITH) {
                const is_marked = await markReportAs(report_id, "DEALT_WITH");
                return new Response(is_marked ? 'Marked as dealt with!' : 'Not marked.', { status: 200 });
            }
            else if (command == ManageReportType.MARK_AS_IGNORED) {
                const is_marked = await markReportAs(report_id, "IGNORED");
                return new Response(is_marked ? 'Marked as ignored!' : 'Not marked.', { status: 200 });
            }
        }

        return new Response('Bad command choice!', { status: 400 });
    }
    
    let { report }: { report: Report } = await request.json();
    if (!report) return new Response('Bad request!', { status: 400 });
    if (!report.reason || report.reason.trim().length == 0) return new Response('Bad request!', { status: 400 });
    if (!report.object_id) return new Response('Bad request!', { status: 400 });

    const product = await getProduct(report.object_id);
    if (!product) return new Response('Bad product!', { status: 400 });
    if (product.deleted) return new Response('Bad product!', { status: 400 });

    report.user_id = sender_id;
    report.created_at = new Date();
    report.status = "ACTIVE";
    
    const createdReportObj = await createReport(report);
    await establishRelationship(sender_id, {
        relationship_type: "POST_REPORT",
        object_id: createdReportObj._id,
        established_at: new Date(Date.now()),
    });

    return new Response('Reported!', { status: 200 });
}