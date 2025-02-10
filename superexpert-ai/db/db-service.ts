
import {prisma} from "./prisma";
import Task from "../../lib/types/task";

export class DbService {

    public async getCurrentTask(userId:string) {
        const task = await prisma.tasks.findFirst({
            where: {
                userId: userId,
            },
            orderBy: {
                id: 'desc'
            }
        });
        return task;
    }

    public async getTaskDefinitions() {
        const taskDefinitions = await prisma.taskDefinitions.findMany({
            orderBy: {
                name: 'asc'
            }
        });
        return taskDefinitions;
    }

}