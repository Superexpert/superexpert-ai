'use client';
import {useState, useEffect} from "react";
import Link from "next/link";
import { doServerAction } from "../server/admin-actions";


export default function AdminTaskDefinitions() {

    useEffect(() => {
        const doSomething = async () => {
            doServerAction();
        };
        doSomething();
    }, []);

    return (
        <div>
            <h1>Task Definitions</h1>
            <p>Task definitions are the instructions that the AI will follow to complete a task.</p>
{/* 
            <div>
                {taskDefinitions.map((taskDefinition) => (
                    <div>
                        {taskDefinition.name}
                        {new Date(taskDefinition.createdAt).toLocaleString()}
                    </div>
                ))}
            </div> */}
            <div>
                <Link href="/admin/task-definitions/new">New Task Definition</Link>
            </div>
        </div>
    )

}