import { concat, isEmpty, isNil, join, split } from 'lodash';
import { DateTime } from 'luxon';
import { IUser, User } from '../models/user.class';
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
    nothing_count: number = 0;

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
    meetingTypes: string[] = [];        // add to tags

    description: string = '';
    description_links: string[] = [];

    tags_custom: string[] = [];

    // trailing _ indicates toLower()
    tags_description_: string[] = [];
    tags_location_: string[] = [];
    tags_custom_: string[] = [];        // Secretary added tags
    tags_name_: string[] = [];
    tags_: string[] = [];

    recurrence: IRecurrence = new Recurrence();
    timezone: string = "America/New_York";
    time24h: string = "00:00";
    duration: number = 60;
    continuous: boolean = false;

    // these fields should only be populated by Daily meetings
    // startTime/endTime creates a window of time which can be searched for containing a specific point in time on any day 
    // this is used to search where meetings are at a specific time on any day
    startTime: number = 0;      // Millisecond UTC 0 time offset of 1/1/1970 + timezone + startTime
    endTime: number = 0;        // startTime + duration

    // these fields should only be populated by Weekly meetings
    // startDateTime is a point in time this meeting starts which can be searched for within a window of time
    // this is used to search for meetings within a specific day
    startDateTime: number = 0;  // Absolute start DateTime in UTC of Meeting startTime + weekday in Meeting timezone 
    endDateTime: number = Meeting.oneWeekMillis;

    buymeacoffee: string = '';

    get tags(): string[] {
        return this.tags_;
    }

    private _isLive?: boolean = null;
    get isLive(): boolean {
        if (isNil(this._isLive)) {
            if (this.recurrence.type === 'Daily') {
                const now = Meeting.makeThat70sTimeFromISO().toMillis();
                this._isLive = (this.continuous) || (this.startTime <= now) && (now <= this.endTime);      // start <= now <= end
            } else {
                const now = Meeting.makeThat70sDateTimeFromISO().toMillis();
                this._isLive = (this.continuous) || (this.startDateTime <= now) && (now <= this.endDateTime);      // start <= now <= end
            }
            
        }
        return this._isLive;
    }

    // get makeLocalStartDateTime(): DateTime {
    //     return DateTime.local();
    // }

    // returns a DateTime of this meetings local start time
    // get startTimeLocal(): DateTime {
    //     // if this meeting is Weekly (specific dow)
    //     return DateTime.fromMillis(this.startDateTime).toLocal().set({
    //         day: 0,
    //     })
    //     // if this meeting is 
    //     // if this meetings start time is < 12 hours past 

    // }

    private _startTimeString?: string = null;
    get startTimeString(): string {
        if (isNil(this._startTimeString)) {
            // if (this.isLive) return 'Live';

            let timeString = `${this.nextTime.toFormat("h")}`;
            timeString = timeString + (this.nextTime.minute === 0 ? ' - ' : `:${this.nextTime.toFormat("mm")} - `);
            timeString = timeString + `${this.nextTimeEnd.toFormat('h')}` + (this.nextTimeEnd.minute === 0 ? ' ' : `:${this.nextTimeEnd.toFormat("mm")} `);
            timeString = timeString + this.nextTime.toFormat('a');  // (this.nextTime.weekday === DateTime.now().weekday ? this.daytimeString : 
            this._startTimeString = timeString;
        }
        return this._startTimeString;
    }

    private _daytimeString?: string = null;
    get daytimeString(): string {
        if (isNil(this._daytimeString)) {
            const nowMeridiem = DateTime.now().toFormat('a');
            const past = DateTime.now() > this.nextTimeEnd;

            if (past) {
                switch (this.nextTime.toFormat('a')) {
                    case 'AM':
                        if (nowMeridiem === 'PM') return 'Tomorrow'
                        else this._daytimeString = 'Tonight'
                        break;
                    case 'PM':
                        if (nowMeridiem === 'PM') return 'Tonight'
                        else this._daytimeString = 'Tomorrow'
                        break;
                }
                this._daytimeString = 'Tonight'
            } else {
                switch (this.nextTime.toFormat('a')) {
                    case 'AM':
                        if (nowMeridiem === 'PM') return 'Tomorrow'
                        else this._daytimeString = 'Tonight'
                        break;
                    case 'PM':
                        if (nowMeridiem === 'PM') return 'Tonight'
                        else this._daytimeString = 'Tomorrow'
                        break;
                }
                this._daytimeString = 'Tonight'
            }
        }

        return this._daytimeString;
    }

    private _nextTimeEnd?: DateTime = null;
    get nextTimeEnd(): DateTime {
        if (isNil(this._nextTimeEnd)) {
            this._nextTimeEnd = this.nextTime.plus({ minutes: this.duration });
        }
        return this._nextTimeEnd;
    }

    // Determine the next DateTime that this meeting occurs
    // returned DateTime will be in local timezone
    private _nextTime?: DateTime = null;
    get nextTime(): DateTime {
        if (isNil(this._nextTime)) {
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
                    this._nextTime = next;
                } else {
                    // this meeting occurred earlier today, move now to tomorrow at adjusted schedule hh:mm
                    const next = DateTime.now().set({
                        hour: startTime.hour,
                        minute: startTime.minute
                    }).plus({ days: 1 });
                    this._nextTime = next;
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
                    this._nextTime = next;
                } else {
                    const next = DateTime.now().set({
                        hour: startDateTime.hour,
                        minute: startDateTime.minute,
                        weekday: startDateTime.weekday
                    }).plus({ weeks: 1 });
                    this._nextTime = next;
                }
            }
        }

        return this._nextTime;
    }

    private _startTimeFormat?: string = null;
    get startTimeFormat(): string {
        if (isNil(this._startTimeFormat)) {
            this._startTimeFormat = this.tConvert(this.startTimeFormatLocal.toFormat("HH:MM a"));
        }
        return this._startTimeFormat;
    }

    private _startTimeFormatLocal?: DateTime = null;
    get startTimeFormatLocal(): DateTime {
        if (isNil(this._startTimeFormatLocal)) {
            try {
                const start = DateTime.fromObject({
                    hour: Number.parseInt(this.time24h.split(':')[0]),
                    minute: Number.parseInt(this.time24h.split(':')[1]),
                    zone: this.timezone,
                }).setZone('local');
                this._startTimeFormatLocal = start;
            } catch (error) {
                console.error(error);
                // TODO
                // return;
                this._startTimeFormatLocal = <any>null;
            }
        }
        return this._startTimeFormatLocal;
    }

    get meetingTypesString(): string {
        return join(this.meetingTypes, ' ').toUpperCase();
    }

    get tagsString(): string {
        return join(this.tags_, ',').toLowerCase();
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

        // this.updateDayTime();
        // this.updateTags();

        // this._isLive = this.isLive;
        // this._nextTime = this.nextTime;
        // this._startTimeString = this.startTimeString;
        // this._startTimeFormatLocal = this.startTimeFormatLocal;
    }

    toObject(): IMeeting {
        // list properties that are static or computed (not serialized into the database)
        const exclude = [   'tags', 'nextDateTime', 'meetingSub', 'weekdays', 'weekday', 'tagsString', 'meetingTypesString', 'isLive', 
                            'startTimeString', 'startTimeFormatLocal', 'startTimeFormat', 'nextTime', 'daytimeString', 'nextTimeEnd'];
        return super.toObject([...exclude, ...exclude.map(e => `_${e}`)]);
    }

    setFeedback(feedback: any) {
        if (feedback.success) {
            this.verified_count++;
        } else if (feedback.nothing) {
            this.nothing_count++;
            this.verified = false;
            this.active = false;
        } else if (feedback.waiting) {
            this.waiting_count++;
            this.verified = false;
            this.active = false;
        } else if (feedback.password) {
            this.password_count++;
            this.verified = false;
            this.active = false;
        }
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

    isHome(user: User): boolean {
        return user.homeMeeting === this.id;
    }

    public update(): Meeting {
        this.updateProperties();
        this.updateTags();
        this.updateDayTime();

        return this;
    }

    public updateProperties() {
        if (this.meetingTypes.find(mt => mt === '24/7')) this.continuous = true;
        if (this.meetingTypes.find(mt => mt === 'C')) this.closed = true;

        if (this.meetingTypes.find(mt => mt === 'MO')) {
            this.restricted = true;
            this.restrictedDescription = "Male Gender Only";
        }

        if (this.meetingTypes.find(mt => mt === 'WO')) {
            this.restricted = true;
            this.restrictedDescription = "Female Gender Only";
        }
    }

    public updateTags() {
        this.tags_custom_ = this.tags_custom.map(t => t.toLowerCase());

        // TODO improve this filtering with word filtering
        const filter = t => {
            return !isNil(t) && !isEmpty(t) && t.length > 2 && !([null, 'Temp', 'not', 'the', 'and', 'but', 'for', 'nor', 'yet', 'from', 'are'].includes(t))
        };

        this.continuous = this.meetingTypes.find(mt => mt === '24/7') === undefined ? false : true;
        this.tags_description_ = concat(split(this.description, ' ')).map(t => t.toLowerCase()).filter(filter);
        this.tags_name_ = concat(split(this.name, ' ')).map(t => t.toLowerCase()).filter(filter);
        this.tags_location_ = concat(split(this.location, ', ')).map(t => t.toLowerCase()).filter(filter);

        this.tags_ = concat(this.meetingTypes.map(mt => mt.toLowerCase()), this.tags_custom_, this.tags_name_, this.tags_location_, this.tags_description_);

        // this.description_links= [];
    }

    public updateDayTime() {

        try {
            if (this.recurrence.type === 'Continuous') {
                this.recurrence.weekly_day = '';
                this.recurrence.weekly_days = [];
                this.startTime = 0;
                this.endTime = this.startTime + this.duration * 60 * 1000;  // TODO config
                this.startDateTime = 0;
                this.endDateTime = 0;
            } else if (this.recurrence.type === 'Daily') {
                // If 'daily' meeting, set weekly_days to all days
                // @ts-ignore
                this.recurrence.weekly_day = '';
                this.recurrence.weekly_days = Meeting.weekdays; // TODO for future possible use Zoom api?
                this.startTime = Meeting.makeThat70sTime(this.time24h, this.timezone).toMillis();
                this.endTime = this.startTime + this.duration * 60 * 1000;  // TODO config
                this.startDateTime = 0;
                this.endDateTime = 0;
            } else {
                // @ts-ignore
                if (!this.recurrence.weekly_day) throw new Error('invalid weekly_day');
                this.recurrence.weekly_days = [this.recurrence.weekly_day];    // TODO for future possible use Zoom api?
                this.startDateTime = Meeting._makeFrom24h_That70sDateTime(this.time24h, this.timezone, this.recurrence.weekly_day).toMillis();
                this.endDateTime = this.startDateTime + this.duration * 60 * 1000;
                this.startTime = 0;
                this.endTime = 0;
            }

            // old development comments....
            //
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

    public static startIndex: any = {
        startTime: { 
            ood: false,
            startAfter: Meeting.oneDayMillis * -1, 
            id: null 
        },
        startDateTime: { 
            ood: false,
            startAfter: Meeting.oneWeekMillis * -1, 
            id: null 
        }
    };
}