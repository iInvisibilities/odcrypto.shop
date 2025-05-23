import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import type { Report } from "$lib/types/reports";
import { createReport, deleteReport, getReport, getReportsOfObject, getReportsOfUser, markReportAs, getReportsOfObject_Name, getReportsOfUser_Name } from "$lib/server/database/db_man/reports";
import { deleteEstablishedRelationship, establishRelationship, getAllRelationshipsOfType } from "$lib/server/database/db_man/object_relationships";
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

    const object_name = url.searchParams.get('object_name');
    const user_name = url.searchParams.get('user_name');

    const object_id = url.searchParams.get('object_id');
    const user_id = url.searchParams.get('user_id');

    if (!object_id && !user_id && !object_name && !user_name) return new Response('Bad request!', { status: 400 });

    const reports: Report[] = [];
    let chosen_type: string = "";
    if (object_id) {
        if (!ObjectId.isValid(object_id)) return new Response('Bad object id!', { status: 400 });

        chosen_type = "object_id";
        const reportsOfObject = await getReportsOfObject(object_id);
        reports.push(...reportsOfObject);
    }
    else if (user_id) {
        if (!ObjectId.isValid(user_id)) return new Response('Bad user id!', { status: 400 });
        
        chosen_type = "user_id";
        const reportsOfUser = await getReportsOfUser(user_id);
        reports.push(...reportsOfUser);
    }
    else if (object_name) {
        if (object_name.trim().length < 3) return new Response('Bad object name!', { status: 400 });

        chosen_type = "object_name";
        const reportsOfObject_Name = await getReportsOfObject_Name(object_name);
        reports.push(...reportsOfObject_Name);
    }
    else if (user_name) {
        if (user_name.trim().length < 3) return new Response('Bad object name!', { status: 400 });

        chosen_type = "user_name";
        const reportsOfUser_Name = await getReportsOfUser_Name(user_name);
        reports.push(...reportsOfUser_Name);
    }
    if (reports.length == 0) return new Response('No reports found!', { status: 404 });


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
        
        if (Object.keys(ManageReportType).includes(command)) {
            const { report_ids }: { report_ids:string[] } = await request.json();
            if (!report_ids) return new Response('Bad request!', { status: 400 });

            let errors_occurred = 0;
            report_ids.forEach(async (report_id: string) => {
                if (!ObjectId.isValid(report_id)) {
                    errors_occurred++;
                    return;
                }
            
                const is_super = (auth.user as Record<string, any>).is_super;

                const report = await getReport(report_id);
                if (!report) {
                    errors_occurred++;
                    return;
                }

                if (command == ManageReportType.DELETE_REPORT) {
                    const is_user:boolean = await is_the_one_who_posted_this_report(sender_id, report_id);

                    if (!is_super && !is_user) {
                        errors_occurred++;
                        return;
                    }
                    const is_deleted = await deleteReport(report_id);

                    if (is_deleted && !is_user) {
                        await establishRelationship(sender_id, {
                            relationship_type: "MANAGE_REPORT",
                            object_id: new ObjectId(report_id),
                            established_at: new Date(Date.now()),
                        });
                    }
                    else if (is_deleted && is_user) {
                        await deleteEstablishedRelationship(
                            sender_id,
                            report_id,
                            "POST_REPORT"
                        );
                    }

                    return;
                }
                else if (command == ManageReportType.MARK_AS_DEALT_WITH) {
                    if (!is_super) {
                        errors_occurred++;
                        return;
                    }
                    const is_marked = await markReportAs(report_id, "DEALT_WITH");
                    if (is_marked) {
                        await establishRelationship(sender_id, {
                            relationship_type: "MANAGE_REPORT",
                            object_id: new ObjectId(report_id),
                            established_at: new Date(Date.now()),
                        });
                    }

                    return;
                }
                else if (command == ManageReportType.MARK_AS_IGNORED) {
                    if (!is_super) {
                        errors_occurred++;
                        return;
                    }
                    const is_marked = await markReportAs(report_id, "IGNORED");
                    if (is_marked) {
                        await establishRelationship(sender_id, {
                            relationship_type: "MANAGE_REPORT",
                            object_id: new ObjectId(report_id),
                            established_at: new Date(Date.now()),
                        });
                    }

                    return;
                }
            });

            return new Response('Operation(s) completed with ' + errors_occurred + ' error(s)', { status: errors_occurred > 0 ? 400 : 200 });
        }
        else {
            return new Response('Bad command choice!', { status: 400 });
        }
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

const is_the_one_who_posted_this_report = async (user_id: string | undefined, report_id: string) => {
    if (!user_id) return false;
    const relationships = await getAllRelationshipsOfType(user_id, "POST_REPORT");
    return relationships.some((relationship) => relationship.object_id?.toString() == report_id);
}