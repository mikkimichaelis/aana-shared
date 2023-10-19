import { DateTime } from 'luxon';
import { Id, IId } from './id.class';


export interface IMeetingReminder extends IId {
    id: string;     // should be mid?
    uid: string;
    mid: string;
    created: string;
    updated: number;
    reminders: string[];
}


export interface IReminder extends IId {
    eid: string;        // calendar event id
    uid: string;
    mid: string;
    created: string;
    timezone: string;
    active: boolean;
    paused: boolean;
    recurring: boolean; // is a one time reminder?
    atDayTime$: string;
    atMillis: number;
    duration: number;
    alert: number;
    name: string;
    startTime$: string;
    message: string;
    url: string;
    pw: string;
    updated: number;
}

export class Reminder extends Id implements IReminder {
    eid: string = '';
    uid: string = '';
    mid: string = '';
    created: string = DateTime.now().toLocaleString(DateTime.DATETIME_SHORT);
    timezone: string = DateTime.now().zoneName as string;
    active: boolean = true;
    paused: boolean = false;
    recurring: boolean = true;
    atDayTime$: string = '';
    atMillis: number = 0;
    duration: number = 0;
    alert: number = 0;
    name: string = '';
    startTime$: string = '';
    message: string = '';
    url: string = '';
    pw: string = '';
    updated: number = 0; 

    constructor(reminder: IReminder) {
        super(reminder);
        this.initialize(this, reminder);

    }

    update() {
        const localStart = DateTime.fromMillis(this.atMillis).setZone(this.timezone);
        this.atMillis = Math.floor((this.atMillis / 1000) * 1000); // Strip any milliseconds from atMillis
        this.atDayTime$ = localStart.toFormat('EEEE t');
        this.startTime$ = localStart.toLocaleString(DateTime.TIME_SIMPLE);
    }
}