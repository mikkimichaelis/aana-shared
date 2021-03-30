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

    groupType: string;
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
        // const now = Meeting.makeThat70sTime(;
        return false; // TODO (this.continuous) || (this.startTime <= now) && (now <= this.endTime);      // start <= now <= end
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

    static first_weekdays = ['Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];
    static first_weekday2index(weekday: string) {
        try {
            return this.first_weekdays.indexOf(weekday) + 1;
        } catch {
            throw new Error(`Meeting.first_weekday2index(): ERROR invalid dow: ${weekday}`);
        }
    }

    static weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    static weekday2index(weekday: string) {
        try {
            return this.weekdays.indexOf(weekday) + 1;
        } catch {
            throw new Error(`Meeting.weekday2index(): ERROR invalid dow: ${weekday}`);
        }
    }

    static oneDayMillis = 86400000;  // 24 * 60 * 60 * 1000 -1
    // Remove one because the last ms actually starts the next day
    // or think like this
    // Each day starts with 0ms
    // Realize that that 0th ms did go by in Time.
    // Just because the number value is 0 does not mean it did not exist.
    // Then....
    // The 1st ms goes by and we have past another Unit of Time
    // and we are at the 1st ms of that day, 
    // as we had previously existed in the 0th Unit of Time on that day.
    //
    // Essentially Time is a zero based array of Units of Time
    //
    // so 24 * 60 * 60 * 1000 is the number of ms in one day (non zero based index)
    // but time is a zero based array of UoT and to adjust for this
    // we subtract 1 from the non zero based index.

    static oneWeekMillis = (7 * (Meeting.oneDayMillis));  // add back in the 0th index, make a week unit of time
    // the reason for the removal of 1ms is the same concept as the above oneDayMills
    // We still have a zero based array of Millis
    // so the last ms belongs -to the next week- ;-)

    isHome(user: User): boolean {
        return user.homeMeeting === this.id;
    }

    updateDayTime() {

        if (this.recurrence.type === 'Daily') {
            // If 'daily' meeting, set weekly_days to all days
            this.recurrence.weekly_days = Meeting.weekdays;
        }

        try {

            this.startTime = Meeting.makeThat70sTime(this.time24h, this.timezone);

            // This is the little magic box of Time.
            // All meeting's startTime(s) are set to occur on 1/1/1970 in UTC ms.
            // This creates a 24h box of time in which all startTimes exist.
            // A recurring time is indifferent to the specific day it happens on
            // because the time happens on all days.
            //
            // This allows for searches for startTime for any meeting on any Day.
            // Of course, meetings actually happen at a time on a Specific Day
            // That is addressed below.
            // this.startTime = DateTime.fromObject({
            //     year: 1970,
            //     month: 1,
            //     day: 1,
            //     hour: Number.parseInt(this.time24h.split(':')[0]),
            //     minute: Number.parseInt(this.time24h.split(':')[1]),
            //     zone: this.timezone,
            // }).toUTC().toMillis();

            // Here is the little magic.
            // If the startTime falls outside 1/1/1970 UTC (due to startTimes in different UTC offsets),
            // simply rotate the startTime back into the opposite edge of the 24h window

            // #1                            [--------1/1/1970--------]                             array of 24hs
            // #2                           [[--------1/1/1970--------],[--------1/2/1970--------]] array of 2 Days
            // #3 1/2/1970 22:00:00 GMT-0800 [------------------------------->startTime          ]  st === 1/2/1970 06:00:00 GMT+0000                              
            // 
            //
            // startTime is created in the TZ of the meeting and then placed in 1/1/1970 UTC+0
            // due to UTC offsets this may place startTime outside the box.
            //
            // #3 1/1/1970 22:00:00 UTC-0800 starts @ 1/2/1970 00:06:00 UTC+0 (outside the magic 1/1/1970 box)
            // but thats ok, we simply subtract oneDayMills from startTime to move it back into the box.

            //    [[--------1/1/1970--------],[--------1/2/1970--------]]   array of 48hs
            // #4   -->startTime                                            st 1/1/1970 00:06:00 GMT-0800

            // #4 Note the day is different (actually 12/31/1969 for UTC-0800)
            // but this does not matter as we are only encoding the Time in startTime!
            //
            // Note the opposite case for a TZ positive to UTC+0 is handled similarly by positive rotation

            // If this startTime happens in 1/2/1970 UTC+0, rotate it backward onDayMillis
            // if (this.startTime >= Meeting.oneDayMillis) this.startTime = this.startTime - Meeting.oneDayMillis;

            // // If this startTime happens in 12/31/1969 UTC+0, rotate it forward onDayMillis
            // if (this.startTime < 0) this.startTime = this.startTime + Meeting.oneDayMillis;

            // // set the endTime
            // this.endTime = this.startTime + (this.duration * 60 * 1000);


            // This is the big magic box of Time.
            // All meeting's startDateTime(s) are set to occur the first week of 1/1/1970 in UTC ms.
            // This creates a 7d box of time in which all startDateTime exist.
            // A recurring time is indifferent to the specific week it happens on
            // because the time happens on the same day every week.
            //
            // This allows for searches for startDateTime for any meeting on any Day at a particular Time.
            // 
            // Yes startDateTime does also encode the the same Time component as startTime,
            // however being NoSQL it makes for easier and more flexible queries to encode startTime separately
            // this.startDateTime = DateTime.fromObject({
            //     year: 1970,
            //     month: 1,
            //     day: 1,
            //     hour: Number.parseInt(this.time24h.split(':')[0]),
            //     minute: Number.parseInt(this.time24h.split(':')[1]),
            //     zone: this.timezone,
            // }).set({ weekday: Meeting.weekday2index(this.recurrence.weekly_day) }).toUTC().toMillis();

            // Here is the big magic.
            // The concept here is the same as the little magic
            // just on a 7 times larger array of UoT

            // here's the illustration
            //
            // #1 [[Sun24h][Mon24h][Tue24h][Wed24h][Thu24h][Fri24h][Sat24h]]                            array of 7ds of 24hs ea
            //                                                                                          array of 2 weeks (below)
            // #2 [[[Sun24h][Mon24h][Tue24h][Wed24h][Thu24h][Fri24h][Sat24h]],[[Sun24h][Mon24h][Tue24h][Wed24h][Thu24h][Fri24h][Sat24h]]]  
            // #3 1/2/70 -0800 [------------------------------------------------->startDateTime ... ]   sdt === 1/8/1970 +0000                              
            // 
            //
            // startDateTime is created in the TZ of the meeting and then placed in the week of 1/1/1970 UTC+0
            // due to UTC offsets this may place startDateTime into the next week.
            //
            // Stated simply, recurring Meetings that occur on Sunday at 1am UTC+0 do not care which week of the year they occur on.
            //
            // This or others similar helps https://codechi.com/dev-tools/date-to-millisecond-calculators/comment-page-3/#comments

            // if (this.startDateTime >= Meeting.oneWeekMillis) this.startDateTime = this.startDateTime - Meeting.oneWeekMillis;
            // if (this.startDateTime < 0) this.startDateTime = this.startDateTime + Meeting.oneWeekMillis;

            this.startDateTime = Meeting.makeThat70sDateTime(this.time24h, this.timezone, this.recurrence.weekly_day)
            // debugger;

        } catch (error) {
            console.error(error);
            // TODO
            // return;

            // TODO good idea
            // map out function call branches and exception propagation
            // show graphically in cs code
            // allow selecting a function call and evaluating for error handling
            // allow adding try/catch/finally refactoring
            // add exception routingModule to direct all Errors to configured handlers
            // ie Alert service receives a copy of all rendering an Error <blurb>
            // ie retryModule as a DAL handles all data related retry logic
            // logging service gathers app state and bundles with error and submits
            // monitorService watches for frequent network errors and begins bandwidth and latency tests and loggs
            // jsmapService uses bundled debug map files to generate file and line code
        }
    }

    static makeThat70sTimeFromISO(iso_time: string) {
        let time = DateTime.fromISO(iso_time);
        return Meeting.makeThat70sTime(`${time.hour}:${time.minute}`, time.zoneName);
    }

    static makeThat70sTime(time24h: string, timezone: string): number {
        let startTime = DateTime.fromObject({
            year: 1970,
            month: 1,
            day: 1,
            hour: Number.parseInt(time24h.split(':')[0]),
            minute: Number.parseInt(time24h.split(':')[1]),
            zone: timezone,
        }).toUTC().toMillis();

        if (startTime >= Meeting.oneDayMillis) startTime = startTime - Meeting.oneDayMillis;
        if (startTime < 0) startTime = startTime + Meeting.oneDayMillis;

        return startTime;
    }

    static makeThat70sDateTimeFromISO(iso_dateTime: string) {
        let dateTime = DateTime.fromISO(iso_dateTime);
        return Meeting.makeThat70sDateTime(`${dateTime.hour}:${dateTime.minute}`, dateTime.zoneName, dateTime.weekdayLong);
    }

    static makeThat70sDateTime(time24h: string, timezone: string, weekday: string): number {
        const weekday_index = Meeting.weekday2index(weekday);
        let startDateTime = DateTime.fromObject({
            year: 1970,
            month: 1,
            day: 1,
            hour: Number.parseInt(time24h.split(':')[0]),
            minute: Number.parseInt(time24h.split(':')[1]),
            zone: timezone,
        }).set({ weekday: weekday_index }).toUTC().toMillis()

        if (startDateTime >= Meeting.oneWeekMillis) startDateTime = startDateTime - Meeting.oneWeekMillis;
        if (startDateTime < 0) startDateTime = startDateTime + Meeting.oneWeekMillis;

        return startDateTime;
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