'use client';
import {useState, useEffect} from "react";
import Link from "next/link";
import { getTaskDefinitionList } from "@/lib/server/admin-actions";


export default function AdminTaskDefinitions() {
    const [taskDefinitions, setTaskDefinitions] = useState<{id:number, description:string}[]>([]);

    useEffect(() => {
        const doSomething = async () => {
            const result = await getTaskDefinitionList();
            setTaskDefinitions(result);
        };
        doSomething();
    }, []);

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            <h1 className="text-2xl font-bold mb-4">Task Definitions</h1>
            <p className="text-gray-600 mb-6">
                Task definitions are the instructions that the AI will follow to complete a task.
            </p>

            <div className="space-y-4">
                {taskDefinitions.map((td) => (
                    <div key={td.id} className="flex justify-between items-center p-4 bg-gray-100 rounded-lg shadow-sm">
                        <span className="text-lg">{td.description}</span>
                        <Link 
                            href={`/admin/task-definitions/edit/${td.id}`} 
                            className="btnSecondary"
                        >
                            Edit
                        </Link>
                    </div>
                ))}
            </div>

            <div className="mt-6">
                <Link 
                    href="/admin/task-definitions/new"
                    className="btnPrimary"
                >
                    New Task Definition
                </Link>
            </div>
        </div>
    );
}