import { DateTime } from 'luxon';
import { Id, IId } from './id.class';
import { Meeting } from './meeting';


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

    update();
    getNext(): DateTime;
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
    updated: number = DateTime.now().toMillis()

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

    getNext(): DateTime {
        let first = DateTime.now().startOf('month');

        let r1 = DateTime.fromMillis(this.atMillis);       // reminder in ths70's
        let r2 = r1.set({                               // reminder on the 1st this month
            year: first.year,
            month: first.month,
            day: first.day
        });

        // here we interestingly rotate the weekdays array to then calculate
        // a diff that's added to the first day of the month, which then becomes
        // the reminders atMillis.  Good job Mikki :-)  Brilliant!
        let weekdays = [...Meeting.weekdays];           // Sun Mon Tue Wed Thu Fri Sat
        while (weekdays[0] !== r2.weekdayLong) {        // Rotate
            weekdays = this.arrayRotate(weekdays, false);
        }
        let diff = weekdays.indexOf(r1.weekdayLong) - weekdays.indexOf(r2.weekdayLong);

        r2 = r2.plus({ days: diff });
        while(r2 < DateTime.now()) r2 = r2.plus({weeks: 1});
        return r2;
    }

    private arrayRotate(arr, reverse) {
        if (reverse) arr.unshift(arr.pop());
        else arr.push(arr.shift());
        return arr;
    }
}