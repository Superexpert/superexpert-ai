'use client';
import {useState, useEffect} from "react";
import Link from "next/link";
import {getTaskDefinitions} from "@/app/server/admin-actions";
import TaskDefinition from "@/lib/types/task-definition";


export default function AdminTaskDefinitions() {
    const [taskDefinitions, setTaskDefinitions] = useState<TaskDefinition[]>([]);

    useEffect(() => {
        const fetchTaskDefinitions = async () => {
            const data = await getTaskDefinitions();
            setTaskDefinitions(data);
        };
        fetchTaskDefinitions();
    }, []);

    return (
        <div>
            <h1>Task Definitions</h1>
            <p>Task definitions are the instructions that the AI will follow to complete a task.</p>

            <div>
                {taskDefinitions.map((taskDefinition) => (
                    <div>
                        {taskDefinition.name}
                        {new Date(taskDefinition.createdAt).toLocaleString()}
                    </div>
                ))}
            </div>
            <div>
                <Link href="/admin/task-definitions/new">New Task Definition</Link>
            </div>
        </div>
    )

}