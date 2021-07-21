import { isNil, join } from 'lodash';
import { DateTime } from 'luxon';
import { IUser } from '../models/user.class';
import { Id } from '../models/id.class';
import { IRecurrence, Recurrence } from './recurrence';
import { SpecificDay } from '../listings/search-settings';
import { IMeeting } from './imeeting';
export class Meeting extends Id implements IMeeting {

    iid: string = '';

    uid: string = '';
    isZoomOwner: boolean = false;
    
    active: boolean = true;
    verified: boolean = true;
    authorized: boolean = true;

    verified_count: number = 0;
    password_count: number = 0;
    waiting_count: number = 0;
    nothing_count: number= 0;

    meetingUrl: string = '';
    homeUrl: string = '';
    sourceUrl: string = '';

    zid: string = '';
    password: string = '';
    requiresLogin: boolean = false;
    closed: boolean = false;
    restricted: boolean = false;
    restrictedDescription: string = '';

    language: string = 'en';
    postal: string = '';
    location: string = '';
    
    group: string = '';
    name: string = '';
    
    groupType: string = '';
    meetingTypes: string[] = [];

    description: string = '';
    description_links: string[] = [];

    tags_custom: string[] = [];

    tags_description_: string[] = [];
    tags_name_: string[] = [];            // toLower()
    tags_location_: string[];
    tags_custom_: string[] = [];         // +meetingTypes: string[];
    tags: string[] = [];          

    continuous: boolean = false;
    recurrence: IRecurrence = new Recurrence();
    timezone: string = "America/New_York";
    time24h: string = "00:00";
    duration: number = 60;

    // startTime/endTime creates a window of time which can be searched for containing a specific point in time 
    // this is used to search where specificDay is any
    startTime: number = 0;      // Millisecond UTC 0 time offset of 1/1/1970 + timezone + startTime
    endTime: number = 0;        // start + duration

    // startDateTime is a point in time this meeting starts which can be searched for within a window of time
    // this is used to search for meetings withing a specific day
    startDateTime: number = 0;  // Absolute start DateTime in UTC of Meeting startTime + weekday in Meeting timezone 
    endDateTime: number = Meeting.oneWeekMillis;

    buymeacoffee: string = '';

    get isLive(): boolean {
        const now = Meeting.makeThat70sDateTimeFromISO().toMillis();
        return (this.continuous) || (this.startDateTime <= now) && (now <= this.endDateTime);      // start <= now <= end
    }

    get startTimeString(): string {
        if (this.isLive) return 'Live';

        let timeString = `${this.nextTime.toFormat("h")}`;
        timeString = timeString + (this.nextTime.minute === 0 ? ' - ' : `:${this.nextTime.toFormat("mm")} - `);
        timeString = timeString + `${this.nextTimeEnd.toFormat('h')} `;
        timeString = timeString + this.nextTime.toFormat('a');  // (this.nextTime.weekday === DateTime.now().weekday ? this.daytimeString : 

        return timeString;
    }

    get daytimeString(): string {
        const nowMeridiem = DateTime.now().toFormat('a');
        const past = DateTime.now() > this.nextTimeEnd;

        if (past) {
            switch (this.nextTime.toFormat('a')) {
                case 'AM':
                    if (nowMeridiem === 'PM') return 'Tomorrow'
                    else return 'Tonight'
                    break;
                case 'PM':
                    if (nowMeridiem === 'PM') return 'Tonight'
                    else return 'Tomorrow'
                    break;
            }
            return 'Tonight'
        } else {
            switch (this.nextTime.toFormat('a')) {
                case 'AM':
                    if (nowMeridiem === 'PM') return 'Tomorrow'
                    else return 'Tonight'
                    break;
                case 'PM':
                    if (nowMeridiem === 'PM') return 'Tonight'
                    else return 'Tomorrow'
                    break;
            }
            return 'Tonight'
        }
    }

    get nextTimeEnd(): DateTime {
        return this.nextTime.plus({ minutes: this.duration });
    }

    // Determine the next DateTime that this meeting occurs
    // returned DateTime will be in local timezone
    get nextTime(): DateTime {

        if (this.recurrence.type === 'Daily') {
            // Daily meetings use startTime to compare with now time
            const now = Meeting.makeThat70sTime();
            const startTime = DateTime.fromMillis(this.startTime).toLocal();
            if (startTime > now) {
                // this meeting happens later today, adjust now to forthcoming hh:mm
                const next = DateTime.now().set({
                    hour: startTime.hour,
                    minute: startTime.minute
                });
                return next;
            } else {
                // this meeting occurred earlier today, move now to tomorrow at adjusted schedule hh:mm
                const next = DateTime.now().set({
                    hour: startTime.hour,
                    minute: startTime.minute
                }).plus({ days: 1 });
                return next;
            }
        } else {
            // Weekly meetings use startDateTime to compare with now
            const now = Meeting.makeThat70sDateTimeFromISO();
            const startDateTime = DateTime.fromMillis(this.startDateTime).toLocal();
            if (startDateTime > now) {
                // this meeting happens later this week
                const next = DateTime.now().set({
                    hour: startDateTime.hour,
                    minute: startDateTime.minute,
                    weekday: startDateTime.weekday
                });
                return next;
            } else {
                const next = DateTime.now().set({
                    hour: startDateTime.hour,
                    minute: startDateTime.minute,
                    weekday: startDateTime.weekday
                }).plus({ weeks: 1 });
                return next;
                // // this meeting happened previously
                // let adjusted = DateTime.fromMillis(this.startDateTime).toLocal();
                // adjusted = this.recurrence.type === 'Daily' ? adjusted.plus({
                //     days: 1     // meeting is every day, move to next day
                // }) :
                //     adjusted.plus({
                //         days: 7 // meeting is weekly, move to next week
                //     });

                // // adjusted is the next meeting start date/time in 70's time
                // let next = DateTime.local().set({
                //     hour: adjusted.hour,
                //     minute: adjusted.minute,
                //     weekday: adjusted.weekday
                // });
                // return next;
            }
        }
    }

    get startTimeFormat(): string {
        return this.tConvert(this.startTimeFormatLocal.toFormat("HH:MM a"));
    }

    // get nextDateTime(): DateTime {
    //     if (this.continuous) {
    //         return DateTime.local();
    //     } else {
    //         let now = DateTime.local().setZone(this.timezone);
    //         // get next occurrence of meeting this week
    //         let next = now.set({
    //             // TODO is this in 24h?
    //             hour: Number.parseInt(this.time24h.split(':')[0]),
    //             minute: Number.parseInt(this.time24h.split(':')[1]),
    //             weekday: this.recurrence.type === 'Daily' ? now.weekday : this.weekday,
    //         });

    //         if (next < now) {
    //             // meeting has past, move to next day meeting occurs on
    //             next = this.recurrence.type === 'Daily' ? next.plus({
    //                 days: 1 // meeting is every day, move to tomorrow
    //             }) :
    //                 next.plus({
    //                     days: 7 // meeting is weekly, move to next weekday of recurrence
    //                 });
    //         } else {
    //             // meeting is later today, do nothing
    //         }
    //         return next.toLocal();
    //     }
    // }

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

    get meetingTypesString(): string {
        return join(this.meetingTypes, ' ').toUpperCase();
    }

    get tagsString(): string {
        return join(this.tags, ',').toLowerCase();
    }

    get meetingSub(): string {
        return `${this.location} ${this.description}`;
    }

    // Meeting ISO weekday, 1-7, where 1 is Monday and 7 is Sunday
    get weekday(): number {
        // @ts-ignore
        return Meeting.iso_weekday_2_70s_dow[this.recurrence.weekly_day];
    }

    constructor(meeting?: IMeeting) {
        super(meeting);
        this.initialize(this, meeting);

        this.updateDayTime();
    }

    toObject(): IMeeting {
        // list properties that are static or computed (not serialized into the database)
        return super.toObject(['nextDateTime', 'meetingSub', 'weekdays', 'weekday', 'tagsString', 'meetingTypesString', 'isLive', 'startTimeString', 'startTimeFormatLocal', 'startTimeFormat', 'nextTime', 'daytimeString', 'nextTimeEnd']);
    }

    /////////////////////////////////////////////////////////////////////
    // just having fun making structures instead of writing code...... //
    /////////////////////////////////////////////////////////////////////

    // ISO specifies the dow ordering and numbering as 
    // see https://en.wikipedia.org/wiki/ISO_week_date
    // Properties names are WeekdayLong or ISO numeric string index
    // Property values are the corresponding 70's zero-based DayOfWeek
    static iso_weekday_2_70s_dow = {
        'Monday': 5,
        '1': 5,
        'Tuesday': 6,
        '2': 6,
        'Wednesday': 7,
        '3': 7,
        'Thursday': 1,
        '4': 1,
        'Friday': 2,
        '5': 2,
        'Saturday': 3,
        '6': 3,
        'Sunday': 4,
        '7': 4,
    };

    // Monday = 1
    public static get today_weekdayLong(): string {
        // @ts-ignore
        return Meeting.weekdays[DateTime.local().weekday]
    }
    static weekdays = [null, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    static iso_weekday_2_iso_index(weekday: any) { return this.weekdays.indexOf(weekday); }
    static oneDayMillis = 86400000;  // 24 * 60 * 60 * 1000
    static oneWeekMillis = (7 * (Meeting.oneDayMillis));

    isHome(user: IUser): boolean {
        return user.homeMeeting === this.id;
    }

    updateDayTime() {

        if (this.recurrence.type === 'Daily') {
            // If 'daily' meeting, set weekly_days to all days
            // @ts-ignore
            this.recurrence.weekly_days = Meeting.weekdays;
            // this.startTime   // TODO WTF? review, probably needs deleting...but was not causing compile error
        }

        try {
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
            // }).set({ weekday: IMeeting.weekday2index(this.recurrence.weekly_day) }).toUTC().toMillis();

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

            this.startTime = Meeting.makeThat70sTime(this.time24h, this.timezone).toMillis();
            this.endTime = this.startTime + this.duration * 1000 * 60;  // TODO config
            // @ts-ignore
            this.startDateTime = Meeting._makeFrom24h_That70sDateTime(this.time24h, this.timezone, this.recurrence.weekly_day).toMillis();
            this.endDateTime = this.startDateTime + this.duration * 60 * 1000;
        } catch (error) {
            console.error(error);
            // TODO some random thought.....
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

    // TODO consolidate these......
    static makeThat70sDateTimeFromISO(iso_dateTime?: string): DateTime {
        const dateTime: DateTime = isNil(iso_dateTime) ? DateTime.local() : DateTime.fromISO(<any>iso_dateTime);
        // @ts-ignore
        return Meeting.makeThat70sDateTime(dateTime);
    }

    static makeThat70sTimeFromISO(iso_time?: string) {
        let time = isNil(iso_time) ? DateTime.local() : DateTime.fromISO(iso_time);
        return Meeting.makeThat70sTime(time);
    }

    static makeThat70sTime(anyTime?: any, timezone?: string): DateTime {
        let time: DateTime | null = DateTime.local();
        if (!isNil(anyTime)) {
            switch (typeof anyTime) {
                case 'string':
                    time = anyTime.length !== 5 ? DateTime.fromISO(anyTime)
                        : Meeting.makeFrom24h_That70sDateTime(
                            Number.parseInt(anyTime.split(':')[0]),
                            Number.parseInt(anyTime.split(':')[1]),
                            // @ts-ignore
                            timezone,
                            'Thursday');
                    break;
                case 'number':
                    time = Meeting.makeThat70sDateTime(DateTime.fromMillis(anyTime));
                    break;
                case 'object':
                    time = anyTime;
                    break;
                default:
                    debugger;
            }
        }

        // time only is always on 1/1/1970
        // @ts-ignore
        time = time.set({ year: 1970, month: 1, day: 1 });
        return time;
    }

    static makeThat70sWeekday(start: DateTime, end: DateTime, weekday: any): { start: DateTime, end: DateTime } {
        // get weekday to move this search to
        weekday = weekday !== SpecificDay.today ? weekday : DateTime.local().weekday;

        // align weekday into 70's dow
        // @ts-ignore
        weekday = Meeting.iso_weekday_2_70s_dow[weekday];

        // save original size of window
        const diff = end.diff(start);   // save start-end diff so we know where to put end (if on a different day)

        const _start: DateTime = start.set({ day: weekday });                     // set new start weekday
        const _end: DateTime = _start.plus({ milliseconds: diff.milliseconds }); // adjust end to new start
        return { start: _start, end: _end };
    }

    static makeThat70sDateTime(dateTime: DateTime, iso_weekday?: any): DateTime | null {
        try {
            // @ts-ignore
            let day: any = isNil(iso_weekday) ? Meeting.iso_weekday_2_70s_dow[dateTime.weekdayLong] : Meeting.iso_weekday_2_70s_dow[iso_weekday]
            const dt = DateTime.fromObject({
                year: 1970,
                month: 1,
                day: day,
                hour: dateTime.hour ? dateTime.hour : 0,
                minute: dateTime.minute ? dateTime.minute : 0,
                second: dateTime.second ? dateTime.second : 0,
                zone: dateTime.zoneName ? dateTime.zoneName : 'local',
            });
            // console.log(dt.toISO());
            return dt;
        } catch (error) {
            console.log(`makeThat70sDateTime(): ERROR ${error.message}`);
            return null;
        }
    }

    static makeFrom24h_That70sDateTime(hour: number, minute: number, timezone: string, weekday: string): DateTime | null {
        try {
            // @ts-ignore
            let day: number = Meeting.iso_weekday_2_70s_dow[weekday];
            return DateTime.fromObject({
                year: 1970,
                month: 1,
                day: day,
                hour: hour,
                minute: minute,
                zone: timezone,
            });
        } catch (error) {
            console.log(`makeThat70sDateTime(): ERROR ${error.message}`);
            return null;
        }
    }

    static _makeFrom24h_That70sDateTime(time24h: string, timezone: string, weekday: string): DateTime | null {
        return this.makeFrom24h_That70sDateTime(Number.parseInt(time24h.split(':')[0]),
            Number.parseInt(time24h.split(':')[1]),
            timezone,
            weekday);
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

    public static startIndex: IMeeting = {
        startDateTime: Meeting.oneWeekMillis * -1,
        startTime: Meeting.oneDayMillis * -1
    } as IMeeting;
}