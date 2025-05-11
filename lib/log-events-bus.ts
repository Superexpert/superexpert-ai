import { EventEmitter } from 'node:events';
export const logBus = new EventEmitter();

/* attach once to the logStream that comes from the framework */
import { logStream } from '@superexpert-ai/framework/server';
logStream.on('data', (row) => {
  logBus.emit('row', row);                    
});