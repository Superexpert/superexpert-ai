// All conversations start with this user message
export const START_MESSAGE = process.env.START_MESSAGE || "Hello";

// The maximum number of messages to retrieve in a conversation
export const MAX_MESSAGES = process.env.MAX_MESSAGES || 30;

// After this number of hours, messages will be deleted from the database
export const MESSAGE_RETENTION_HOURS = process.env.MESSAGE_RETENTION_HOURS || 1;

// What the agent displays when there is a network error
export const CHAT_ERROR_MESSAGE = 'My brain went offline for a sec — classic ‘AI brain fog.’ Trying to reboot my wisdom!';