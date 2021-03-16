import * as _ from 'lodash';

import { DateTime } from 'luxon';
import { User } from '../models';

import { Id, IId } from "../models/id.class";
import { IRecurrence, Recurrence } from './recurrence';

export interface IMeeting extends IId {
    
    uid: string;
    
    active: boolean;
    verified: boolean;
    authorized: boolean;

    zid: string;
    isZoomOwner: boolean;
    password: string;
    requiresLogin: boolean;
    restricted: boolean;
    restrictedDescription: string;

    postal: string;
    group: string;  // 12 Step clubhouse name (ie 'Westside Club')
    name: string;
    language: string;

    closed: boolean;
    types: string[];
    typesString: string;

    tags: string[];
    tagsString: string;

    continuous: boolean;
    recurrence: IRecurrence;
    startTime: string;  // HH:MM
    duration: number;

    // Meeting window of time on 1/2/1970 00:00Z - 24:00Z
    start: number;      // that70sTime
    end: number;        // start + duration

    timezone: string;   // Use this to offset local to Z time to search within start:end window
    
    buymeacoffee: string;

    
}

export class Meeting extends Id implements IMeeting {
    
    uid: string = '';
    active: boolean = true;
    verified: boolean = true;
    authorized: boolean = true;  // TODO is owner paid?
    // private

    zid: string = '';
    isZoomOwner: boolean = false;
    requiresLogin: boolean = false;
    password: string = '';
    restricted: boolean = false;
    restrictedDescription: string = '';
    
    postal: string = '';
    group: string = '';
    name: string = '';
    language: string = 'en-us';
    
    closed: boolean = false;
    types: string[] = [];
    tags: string[] = [];

    continuous: boolean = false;
    timezone: string = "America/New_York";
    startTime: string = "00:00";
    duration: number = 60;

    start: number = 0;    // Millisecond UTC 0 time offset of 1/2/1970 + timezone + startTime
    end: number = 0;    // start + duration

    recurrence: IRecurrence = new Recurrence();

    buymeacoffee: string = '';

    get nextTime(): DateTime {
        return this.startTimeFormatLocal;
    }

    get startTimeFormat(): string {
        return this.tConvert(this.startTimeFormatLocal.toFormat("HH:MM a"));
    }

    get startTimeFormatLocal(): DateTime {
        try {
            const start = DateTime.fromObject({
                hour: Number.parseInt(this.startTime.split(':')[0]),
                minute: Number.parseInt(this.startTime.split(':')[1]),
                zone: this.timezone,
            }).setZone('local');
            return start;
        } catch (e) {
            console.error(e);
            // TODO
            // return;
            return <any>null;
        }
    }

    get isLive(): boolean {
        const now = this.makeThat70sTime(DateTime.local().toISO());
        return   (this.continuous) || (this.start <= now) && (now <= this.end);      // start <= now <= end
    }

    get tagsString(): string {
        return _.join(this.tags, ',').toLowerCase();
    }

    get typesString(): string {
        return _.join(this.types, ',').toUpperCase();
    }

    constructor(meeting?: IMeeting) {
        super(meeting);
        this.initialize(this, meeting);

        this.updateDayTime();
    }

    toObject(): IMeeting {
        return super.toObject(['typesString', 'tagsString', 'isLive', 'startTimeFormatLocal', 'startTimeFormat', 'nextTime']);
    }

    isHome(user: User): boolean {
        return user.homeMeeting === this.id;
    }

    updateDayTime() {

        if (this.recurrence.type === 'Daily') {
            // If 'daily' meeting, set weekly_days to all days
            this.recurrence.weekly_days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        }

        //
        // This is the start date / time of this meeting on each recurrence.
        // Since there is no DateTime concept of specifying a point in time
        // that happens recurring at intervals (ie a DateTime specifies a single
        // specific point in time), I use the following algorithm for recurring Time.
        //
        // Problem
        //
        // start needs to be numeric in value for range 
        //
        try {
            this.start = DateTime.fromObject({
                year: 1970,
                month: 1,
                day: 2,
                hour: Number.parseInt(this.startTime.split(':')[0]),
                minute: Number.parseInt(this.startTime.split(':')[1]),
                zone: this.timezone,
            }).toUTC().toMillis();
        } catch (e) {
            console.error(e);
            // TODO
            // return;
        }

        // console.log({
        //     year: 1970,
        //     month: 1,
        //     day: 2,
        //     hour: Number.parseInt(this.startTime.split(':')[0]),
        //     minute: Number.parseInt(this.startTime.split(':')[1]),
        //     zone: this.timezone,
        // })

        this.end = this.start + (this.duration * 60 * 1000);
    }

    makeThat70sTime(time: string) {
        const _70sTime = DateTime.fromObject({
            year: 1970,
            month: 1,
            day: 2,
            hour: DateTime.fromISO(time).hour,  // search.bySpecific.start
            minute: DateTime.fromISO(time).minute,
            zone: DateTime.local().zone,
          }).toUTC().toMillis();
        return _70sTime;
    }

    // https://stackoverflow.com/questions/13898423/javascript-convert-24-hour-time-of-day-string-to-12-hour-time-with-am-pm-and-no/13899011
    tConvert(time: any) {
        // Check correct time format and split into components
        let t = time.toString().match(/^([01]\d|2[0-3])(:)([0-5]\d)?$/) || [time];

        if (t.length > 1) { // If time format correct
            t = t.slice(1);  // Remove full string match value
            t[5] = +t[0] < 12 ? ' am' : ' pm'; // Set AM/PM
            t[0] = +t[0] % 12 || 12; // Adjust hours
        }
        return t.join(''); // return adjusted time or original string
    }
}