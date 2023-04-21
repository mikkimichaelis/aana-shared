import { DateTime } from "luxon";
import { IUserStats } from ".";
import { Id, IId } from "./id.class";

export enum UserMessageType {
    FEEDBACK = 'Feedback',
    SUPPORT = `Support Request`,
}

export interface IUserMessage extends IId {
    uid: string;                    // user id
    type: UserMessageType,
    email: string,
    message: string;
    reply: boolean;
    public: boolean;
    sent  : boolean;
    messageId: string;
    timestamp: number;              // utc millis
}

export class UserMessage extends Id implements IUserMessage {
    uid = '';
    type = UserMessageType.SUPPORT;
    email: string = '';
    message: string = '';
    reply: boolean = true;
    public: boolean = true;
    sent: boolean = false;
    messageId: string = '';
    timestamp: number = DateTime.now().toMillis();

    constructor(userMessage?: any) {
        super(userMessage);
        this.initialize(this, userMessage);
    }
}