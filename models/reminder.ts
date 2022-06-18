import { Id, IId } from './id.class';

export interface IReminder extends IId {
    uid: string;
    mid: string;
    created: string;
    active: boolean;
    recurring: boolean;
    atMillis: number;
}

export class Reminder extends Id implements IReminder {
    uid: string;
    mid: string;
    created: string;
    active: boolean;
    recurring: boolean;
    atMillis: number;

    constructor(reminder: IReminder) {
        super(reminder);
        this.initialize(this, reminder);
    }
}