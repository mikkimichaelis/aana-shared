import { DateTime } from 'luxon';
import { Id, IId } from './id.class';

export interface IReminder extends IId {
    uid: string;
    mid: string;
    created: string;
    timezone: string;
    active: boolean;
    paused: boolean;
    recurring: boolean; // is a one time reminder?
    atDayTime$: string;
    atMillis: number;
    name: string;
    startTime$: string;
    message: string;
}

export class Reminder extends Id implements IReminder {
    uid: string = '';
    mid: string = '';
    created: string = DateTime.now().toLocaleString(DateTime.DATETIME_SHORT);
    timezone: string = DateTime.now().zoneName;
    active: boolean = true;
    paused: boolean = false;
    recurring: boolean = true;
    atDayTime$: string = '';
    atMillis: number = 0;
    name: string = '';
    startTime$: string = '';
    message: string = '';

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