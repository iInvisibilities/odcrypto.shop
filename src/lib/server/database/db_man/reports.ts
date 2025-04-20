import { MONGODB_NAME, MONGODB_REPORTS_COLLECTION } from '$env/static/private';
import client from '../mongodb';
import type { Report } from '$lib/types/reports';
import { ObjectId } from 'mongodb';
import type { ReportStatus } from '$lib/types/moderator_actions';
import { findUsersWithName } from './users';
import { getProductsWithName } from './products';

const coll = client.db(MONGODB_NAME).collection<Report>(MONGODB_REPORTS_COLLECTION);

export const createReport = async (report: Report): Promise<Report & { _id: ObjectId }> => {
    const result = await coll.insertOne(report);
    return { ...report, _id: new ObjectId(result.insertedId) };
}

export const getReport = async (_id: string): Promise<Report & { _id: ObjectId } | null> => {
    return await coll.findOne({ _id: new ObjectId(_id) });
}

export const getReportsOfUser = async (user_id: string): Promise<Report[]> => {
    return await coll.find({ user_id: user_id }).toArray();
}

export const getReportsOfUser_Name = async (user_name: string): Promise<Report[]> => {
    const users_with_name = await findUsersWithName(user_name);
    const user_ids = users_with_name.map(user => user._id?.toString() ?? "null");

    return await coll.find({ user_id: { $in: user_ids } }).toArray();
}

export const getReportsOfObject = async (object_id: string): Promise<Report[]> => {
    return await coll.find({ object_id: object_id }).toArray();
}

export const getReportsOfObject_Name = async (object_name: string): Promise<Report[]> => {
    const products_with_name = await getProductsWithName(object_name);
    const product_ids = products_with_name.map(product => product._id?.toString() ?? "null");

    return await coll.find({ object_id: { $in: product_ids } }).toArray();
}

export const deleteReport = async (_id: string): Promise<boolean> => {
    const result = await coll.deleteOne({ _id: new ObjectId(_id) });
    return result.deletedCount === 1;
}

export const deleteReports = async (user_id: string): Promise<boolean> => {
    const result = await coll.deleteMany({ user_id: user_id });
    return result.deletedCount === 1;
}

export const markReportAs = async (_id: string, status: ReportStatus): Promise<boolean> => {
    const result = await coll.updateOne({ _id: new ObjectId(_id) }, { $set: { status: status } });
    return result.modifiedCount === 1;
}