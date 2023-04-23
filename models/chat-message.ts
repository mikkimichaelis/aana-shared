import { DateTime } from "luxon";
import { IUserStats } from ".";
import { Id, IId } from "./id.class";

export enum ChatMessageType {
    HTML = 'html'
}

export interface IChatMessage extends IId {
    uid: string;                    // user id
    type: ChatMessageType;
    prompt: boolean;
    completion: boolean;
    html: string;
    timestamp: number;
}

export class ChatMessage extends Id implements IChatMessage {
    uid = '';
    type: ChatMessageType = null;
    prompt: boolean = false;
    completion: boolean = false;
    html: string = '';
    timestamp: number = DateTime.now().toMillis();

    constructor(chatMessage?: any) {
        super(chatMessage);
        this.initialize(this, chatMessage);
    }
}