'use server';
import {ServerTools} from '@/task-definitions/server-tools';
import {getServerToolList} from '@/lib/task-types';


export async function getServerTools() {
  console.log('getServerTools  is awesome');
    new ServerTools();
    const result = getServerToolList();
    return result;
}


