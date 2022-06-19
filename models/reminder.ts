import { DateTime } from 'luxon';
import { Id, IId } from './id.class';

export interface IReminder extends IId {
    uid: string;
    mid: string;
    created: string;
    timezone: string;
    active: boolean;
    recurring: boolean;
    deleted: boolean;
    atDayTime$: string;
    atMillis: number;
}

export class Reminder extends Id implements IReminder {
    uid: string = '';
    mid: string = '';
    created: string = DateTime.now().toLocaleString(DateTime.DATETIME_SHORT);
    timezone: string = DateTime.now().zoneName;
    active: boolean = true;
    recurring: boolean = true;
    deleted: boolean = false;
    atDayTime$: string = '';
    atMillis: number = 0;

    constructor(reminder: IReminder) {
        super(reminder);
        this.initialize(this, reminder);
    }

    update() {
        this.atMillis = Math.floor(this.atMillis / 1000 * 60) * 1000 * 60;    // Strip any seconds from atMillis
        this.atDayTime$ = DateTime.fromMillis(this.atMillis).setZone(this.timezone).toFormat('EEEE t');
    }
}