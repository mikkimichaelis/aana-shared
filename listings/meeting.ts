import * as _ from 'lodash';
import LogRocket from 'logrocket';
import { DateTime } from 'luxon'

import { Id, IId } from "../models/id.class";
import { Schedule, ISchedule } from '../models/schedule.class';
import { IRecurrence, Recurrence } from './recurrence';

export interface IMeeting extends IId {
    zid: string;
    uid: string;
    isZoomOwner: boolean;
    name: string;
    password: string;
    topic: string;
    continuous: boolean;

    timezone: string;
    startTime: string;
    duration: number;

    recurrence: IRecurrence;
}

export interface IZoomMeeting extends IMeeting {
    zid: string;
    zUsersAttend: string[]; // Zoom users in attendance
}

export class Meeting extends Id implements IMeeting {
    zid: string = '';
    uid: string = '';
    active: boolean = true;
    // private
    isZoomOwner: boolean = false;
    name: string = '';
    password: string = '';
    topic: string = '';
    continuous: boolean = false;

    timezone: string = "America/New_York";
    startTime: string = "00:00";
    duration: number = 60;

    start: number = 0;    // Millisecond UTC 0 time offset of 1/2/1970 + timezone + startTime
    end: number = 0;    // start + duration

    // tags

    recurrence: IRecurrence = new Recurrence();

    get startTimeFormat(): string {
        return this.tConvert(this.startTime);
    }

    get startTimeFormatLocal(): DateTime {
        try {
            const start = DateTime.fromObject({
                hour: Number.parseInt(this.startTime.split(':')[0]),
                minute: Number.parseInt(this.startTime.split(':')[1]),
                zone: this.timezone
            }).setZone('local');
            return start;
        } catch (e) {
            LogRocket.error(e);
            // TODO
            // return;
            return null;
        }

    }

    get isLive(): boolean {
        const now = this.makeThat70sTime(DateTime.local().toISO());
        return   (this.start <= now) && (now <= this.end);      // start <= now <= end
    }

    constructor(meeting?: IMeeting) {
        super(meeting);
        this.initialize(this, meeting);

        this.updateDayTime();
    }

    updateDayTime() {

        if (this.recurrence.type == 1) {
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
                zone: this.timezone
            }).toUTC().toMillis();
        } catch (e) {
            LogRocket.error(e);
            // TODO
            // return;
        }

        console.log({
            year: 1970,
            month: 1,
            day: 2,
            hour: Number.parseInt(this.startTime.split(':')[0]),
            minute: Number.parseInt(this.startTime.split(':')[1]),
            zone: this.timezone
        })

        this.end = this.start + (this.duration * 60 * 1000);
    }

    makeThat70sTime(time: string) {
        let _70sTime = DateTime.fromObject({
            year: 1970,
            month: 1,
            day: 2,
            hour: DateTime.fromISO(time).hour,  // search.bySpecific.start
            minute: DateTime.fromISO(time).minute,
            zone: DateTime.local().zone
          }).toUTC().toMillis();
        return _70sTime;
    }

    // https://stackoverflow.com/questions/13898423/javascript-convert-24-hour-time-of-day-string-to-12-hour-time-with-am-pm-and-no/13899011
    tConvert(time: any) {
        // Check correct time format and split into components
        time = time.toString().match(/^([01]\d|2[0-3])(:)([0-5]\d)?$/) || [time];

        if (time.length > 1) { // If time format correct
            time = time.slice(1);  // Remove full string match value
            time[5] = +time[0] < 12 ? ' am' : ' pm'; // Set AM/PM
            time[0] = +time[0] % 12 || 12; // Adjust hours
        }
        return time.join(''); // return adjusted time or original string
    }
}