import { DateTime } from 'luxon';
import { IUserStats } from './user.class';
import { Id, IId } from './id.class';
import { IUserRating } from './user-rating';

export enum UserMessageType {
    FEEDBACK = 'User Feedback',
    SUPPORT = `User Support Request`,
    ATTENDANCE_REPORT = `Attendance Report`
}

export interface IUserMessage extends IId {
    stats: IUserStats;
    rating: IUserRating;

    uid: string;                    // user id

    type: UserMessageType,
    to: string,
    replyTo: string,
    subject: string,
    html: string;
    anonymous: boolean;
    reply: boolean;
    public: boolean;
    sent: boolean;
    messageId: string;
    timestamp: number;              // utc millis
}

export class UserMessage extends Id implements IUserMessage {
    stats = {} as IUserStats;
    rating = {} as IUserRating;
    uid = '';
    type = UserMessageType.SUPPORT;
    to: string = '';
    replyTo: string = '';
    subject: string = '';
    html: string = '';
    anonymous: boolean = false;
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