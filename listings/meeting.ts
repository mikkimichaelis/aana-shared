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

    // test

    zid: string;
    password: string;

    isZoomOwner: boolean;
    requiresLogin: boolean;
    closed: boolean;
    restricted: boolean;
    restrictedDescription: string;

    language: string;
    postal: string;
    location: string;

    meetingUrl: string;
    homeUrl: string;
    sourceUrl: string;

    
    group: string;  // 12 Step clubhouse name (ie 'Westside Club')
    _group: string; // group.toLowercase()
    name: string;   
    _name: string;  // name.toLowercase()
    
    groupType: string;
    meetingTypes: string[];
    description: string;
    tags: string[];
    
    continuous: boolean;
    recurrence: IRecurrence;

    timezone: string;
    time24h: string;  // HH:MM    // startTime
    duration: number;

    // Meeting window of time on 1/2/1970 00:00Z - 24:00Z
    startTime: number;      // that70sTime
    endTime: number;        // start + duration

    startDateTime: number;

    buymeacoffee: string;

    // Non serialized getter properties
    tagsString: string;
    meetingTypesString: string;
    weekday: number;
    isLive: boolean;
    startTimeFormatLocal: DateTime;
    startTimeFormat: string;
    nextTime: DateTime;
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

    meetingUrl: string = '';
    homeUrl: string = '';
    sourceUrl: string = '';

    location: string = '';
    postal: string = '';
    group: string = '';
    get _group(): string {
        return this.group.toLowerCase();
    }
    name: string = '';
    get _name(): string {
        return this.name.toLowerCase();
    }
    language: string = 'en-us';

    description: string = '';
    closed: boolean = false;
    
    groupType : string; 
    meetingTypes: string[] = [];
    tags: string[] = [];

    continuous: boolean = false;
    timezone: string = "America/New_York";
    time24h: string = "00:00";
    duration: number = 60;

    // startTime/endTime creates a window of time which can be searched for containing a specific point in time 
    // this is used to search where byDay is any
    startTime: number = 0;      // Millisecond UTC 0 time offset of 1/1/1970 + timezone + startTime
    endTime: number = 0;        // start + duration

    // startDateTime is a point in time this meeting starts which can be searched for within a window of time
    // this is used to search for meetings withing a specific day
    startDateTime: number = 0;  // Absolute start DateTime in UTC of Meeting startTime + weekday in Meeting timezone 

    recurrence: IRecurrence = new Recurrence();

    buymeacoffee: string = '';

    get nextTime(): DateTime {
        return this.nextDateTime;
    }

    get startTimeFormat(): string {
        return this.tConvert(this.startTimeFormatLocal.toFormat("HH:MM a"));
    }

    get nextDateTime(): DateTime {
        let now = DateTime.local().setZone(this.timezone);
        if (this.continuous) {
            return now.toLocal();
        } else {
        
            // get next recurrence of meeting this week
            let next = now.set({
                // TODO is this in 24h?
                hour: Number.parseInt(this.time24h.split(':')[0]),    
                minute: Number.parseInt(this.time24h.split(':')[1]),
                weekday: this.recurrence.type === 'Daily' ? now.weekday : this.weekday,
            });

            if (next < now) {
                // meeting has past, move to next day meeting occurs on
                next = this.recurrence.type === 'Daily' ? next.plus({
                    days: 1 // meeting is every day, move to tomorrow
                }) : 
                next.plus({ 
                    days: 7 // meeting is weekly, move to next weekday of recurrence
                });
            } else {
                // meeting is later today, do nothing
            }
            return next.toLocal();
        }
    }

    get startTimeFormatLocal(): DateTime {
        try {
            const start = DateTime.fromObject({
                hour: Number.parseInt(this.time24h.split(':')[0]),
                minute: Number.parseInt(this.time24h.split(':')[1]),
                zone: this.timezone,
            }).setZone('local');
            return start;
        } catch (error) {
            console.error(error);
            // TODO
            // return;
            return <any>null;
        }
    }

    get isLive(): boolean {
        const now = this.makeThat70sTime(DateTime.local().toISO());
        return (this.continuous) || (this.startTime <= now) && (now <= this.endTime);      // start <= now <= end
    }

    get meetingTypesString(): string {
        return _.join(this.meetingTypes, ',').toUpperCase();
    }

    get tagsString(): string {
        return _.join(this.tags, ',').toLowerCase();
    }

    // Meeting ISO weekday, 1-7, where 1 is Monday and 7 is Sunday
    get weekday(): number {
        return Meeting.weekday2index(this.recurrence.weekly_day);
    }

    constructor(meeting?: IMeeting) {
        super(meeting);
        this.initialize(this, meeting);

        this.updateDayTime();
    }

    toObject(): IMeeting {
        // list properties that are static or computed (not serialized into the database)
        return super.toObject(['weekdays', 'weekday', 'tagsString', 'meetingTypesString', 'isLive', 'startTimeFormatLocal', 'startTimeFormat', 'nextTime']);
    }

    static weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    static weekday2index(weekday: string) {
        try {
            return this.weekdays.indexOf(weekday) + 1;
        } catch {
            throw new Error(`Meeting.weekday(): ERROR invalid dow: ${weekday}`);
        }
    }

    isHome(user: User): boolean {
        return user.homeMeeting === this.id;
    }

    updateDayTime() {

        if (this.recurrence.type === 'Daily') {
            // If 'daily' meeting, set weekly_days to all days
            this.recurrence.weekly_days = Meeting.weekdays;
        }

        try {
            this.startTime = DateTime.fromObject({
                year: 1970,
                month: 1,
                day: 1,
                hour: Number.parseInt(this.time24h.split(':')[0]),
                minute: Number.parseInt(this.time24h.split(':')[1]),
                zone: this.timezone,
            }).toUTC().toMillis();

            const oneDayMillis = 86400000;  // 24 * 60 * 60 * 1000 TODO this exceeds 1 day by 1ms
            if (this.startTime >= oneDayMillis) this.startTime = this.startTime - oneDayMillis;
            if (this.startTime < 0) this.startTime = this.startTime + oneDayMillis;

            this.endTime = this.startTime + (this.duration * 60 * 1000);

            this.startDateTime = DateTime.fromObject({
                year: 1970,
                month: 1,
                day: 1,
                hour: Number.parseInt(this.time24h.split(':')[0]),
                minute: Number.parseInt(this.time24h.split(':')[1]),
                zone: this.timezone,
            }).set({weekday: Meeting.weekday2index(this.recurrence.weekly_day)}).toUTC().toMillis();

            const oneWeekMillis = 7 * oneDayMillis;  // 7 * 24 * 60 * 60 * 1000
            if (this.startDateTime >= oneWeekMillis) this.startDateTime = this.startDateTime - oneWeekMillis;
            if (this.startDateTime < 0) this.startTime = this.startDateTime + oneWeekMillis;

        } catch (error) {
            console.error(error);
            // TODO
            // return;
        }
    }

    makeThat70sTime(time: string) {
        return DateTime.fromObject({
            year: 1970,
            month: 1,
            day: 1,
            hour: DateTime.fromISO(time).hour,  // search.bySpecific.start
            minute: DateTime.fromISO(time).minute,
            zone: DateTime.local().zone,
        }).toUTC().toMillis();
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