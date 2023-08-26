import { cloneDeep, concat, isEmpty, isNil, join, split } from 'lodash';
import { DateTime } from 'luxon';
import { Id, IId } from '../models/id.class';
import { SpecificDay } from '../models/search-settings';
import { IUser, User } from '../models/user.class';
import { IRecurrence, Recurrence, RecurrenceType } from './recurrence';

export enum VerifiedStatus {
    // ordering here is important as it's used for sorting in api->getNextMeetingVerification()
    VALID,      // worked!
    UNKNOWN,    // one reason for this is a meeting that requires a pw we don't have
    WAITING,    // valid id but not started
    FAILED,     // invalid id or meeting not exists
    NEVER       // never been verified
}

export interface IMeeting extends IId {

    iid: string;    // import id (populated during import from unique source identifier)
    uid: string;    // user id of meeting owner

    active: boolean;
    authorized: boolean;

    verified: boolean;  // this predates verified_status and exists in indexes so I'm leaving, although it duplicates data in verified_status
    verified_status: VerifiedStatus;
    verified_date: number;

    isAdHoc: boolean;

    meetingUrl: string;
    homeUrl: string;
    sourceUrl: string;

    zid: string;
    password: string;
    _password: string;              // this is the url encoded password
    requiresLogin: boolean;
    closed: boolean;
    restricted: boolean;
    restrictedDescription: string;

    language: string;
    postal: string;
    location: string;

    group: string;
    groupType: string;

    meetingTypes: string[];         // tags[]

    name: string;
    description: string;
    description_links: string[];    // url/email 

    // TODO review all this tags stuff
    tags_custom: string[];

    tags_custom_: string[];
    tags_description_: string[];
    tags_name_: string[];           // toLower()
    tags_location_: string[];

    tags_: string[];                // meetingTypes + tags_description_ + tags_name_ + tags_custom_ + tags_location_

    continuous: boolean;

    parent: string;
    recurrence: IRecurrence;
    siblings: string[];

    timezone: string;
    time24h: string;                // HH:MM
    duration: number;

    // startTime/endTime creates a window of time which can be searched for containing a specific point in time 
    // this is used to search where specificDay is any
    startTime: number;              // Millisecond UTC 0 time offset of 1/1/1970 + timezone + startTime
    startTime$: string;             // 'ffff' formatted startTime in timezone
    endTime: number;                // startTime + duration

    // startDateTime is a point in time this meeting starts which can be searched for within a window of time
    // this is used to search for meetings withing a specific day
    startDateTime: number;          // Absolute start DateTime in UTC of Meeting startTime + weekday in Meeting timezone 
    endDateTime: number;            // that70sDateTime

    buymeacoffee: string;

    // Non serialized getter properties
    isVerified: boolean;
    isLive: boolean | null;
    isFeatured: boolean | undefined;
    tMinus: any;    // TODO
    endsIn: any;
    startTimeString: string | null;
    daytimeString: string | null;
    nextTimeEnd: DateTime | null;
    nextTime: DateTime | null;
    startTimeFormat: string | null;
    startTimeFormatLocal: DateTime | null;
    meetingTypesString: string;
    tagsString: string;
    meetingSub: string;
    weekday: number;
    tags: string[];

    updated: number;

    update(): void;
    updateDayTime(): void;
    updateTags(): void;

    isLiveAt(dateTime: DateTime): boolean;

    refresh(): void;
}

export class Meeting extends Id implements IMeeting {

    iid: string = '';
    uid: string = '';

    active: boolean = true;
    authorized: boolean = true;

    verified = true;    // default to hope it's a good meeting :-)
    verified_status = VerifiedStatus.NEVER;
    verified_date = -1;

    isFeatured = undefined;
    isAdHoc = false;

    meetingUrl: string = '';
    homeUrl: string = '';
    sourceUrl: string = '';

    zid: string = '';
    password: string = '';
    _password: string = '';
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

    recurrence: IRecurrence = new Recurrence({});
    
    parent: string = '';
    siblings: string[] = [];

    timezone: string = "America/New_York";
    time24h: string = "00:00";
    duration: number = 60;
    continuous: boolean = false;

    // these fields should only be populated by Daily meetings
    // startTime/endTime creates a window of time which can be searched for containing a specific point in time on any day 
    // this is used to search where meetings are at a specific time on any day
    startTime: number = -1;      // Millisecond UTC 0 time offset of 1/1/1970 + timezone + startTime
    startTime$: string = '';

    // endTime can not be used in calculations here (startTime + duration) must be used
    // the reason is endTime can wrap 
    endTime: number = -1;        // startTime + duration

    // these fields should only be populated by Weekly meetings
    // startDateTime is a point in time this meeting starts which can be searched for within a window of time
    // this is used to search for meetings within a specific day
    startDateTime: number = -1;  // Absolute start DateTime in UTC of Meeting startTime + weekday in Meeting timezone 
    endDateTime: number = -1;

    updated: number = 0;

    buymeacoffee: string = '';

    get tags(): string[] {
        return this.tags_;
    }

    // TODO DEPRECATE - just use verified instead now
    get isVerified(): boolean {
        return this.verified;
    }

    // - Mills till isLive ends
    // + Mills till isLive starts
    private _tminus?: number | null = null;
    get tMinus(): number | null {
        if (isNil(this._tminus)) {
            if (this.continuous) {
                this._tminus = 0;
            }
            else if (this.isLive) {
                this._tminus = this.endsIn * -1;    // Millis till this meeting ends
                // negative value means 'ends in'
            } else {
                this._tminus = this.nextTime.toMillis() - DateTime.now().toMillis();    // Millis till this meeting ends
                // positive value means 'starts in'
            }
        }

        return this._tminus;
    }

    private _endsIn?: number | null = null;
    get endsIn(): number {    // TODO make Duration
        if (isNil(this._endsIn)) {
            if (this.continuous) {
                this._endsIn = Number.MAX_VALUE;
            } else if (this.isLive) {
                if (this.recurrence.type === RecurrenceType.DAILY) {
                    const now = Meeting.makeThat70sTime().toMillis();
                    this._endsIn = (this.startTime + this.duration * 60 * 1000) - now;
                    // console.log(`this.endTime: ${this.endTime} \nnow: ${now}`);
                    // console.log(`$(this._isLiveEnd: ${this._endsIn}`)
                } else {
                    const now = Meeting.makeThat70sDateTime().toMillis();
                    this._endsIn = (this.startDateTime + this.duration * 60 * 1000) - now;
                }
            } else {
                this._endsIn = null;
            }
        }
        return <any>this._endsIn;
    }

    private _isLive?: boolean | null = null;
    get isLive(): boolean | null {
        if (isNil(this._isLive)) {
            if (this.recurrence.type === RecurrenceType.DAILY) {
                const now = Meeting.makeThat70sTime().toMillis();
                this._isLive = this.startTime <= now && now <= this.startTime + this.duration * 60 * 1000;      // start <= now <= end
            } else {
                const now = Meeting.makeThat70sDateTime().toMillis();
                this._isLive = (this.continuous) || (this.startDateTime <= now) && (now <= this.startDateTime + this.duration * 60 * 1000);      // start <= now <= end
            }
        }
        return this.continuous || this._isLive;
    }

    private _startTimeString?: string | null = null;
    get startTimeString(): string | null {
        if (isNil(this._startTimeString)) {
            // if (this.isLive) return 'Live';

            let timeString = `${this.nextTime?.toFormat("h")}`;
            timeString = timeString + (this.nextTime?.minute === 0 ? ' - ' : `:${this.nextTime?.toFormat("mm")} - `);
            timeString = timeString + `${this.nextTimeEnd?.toFormat('h')}` + (this.nextTimeEnd?.minute === 0 ? ' ' : `:${this.nextTimeEnd?.toFormat("mm")} `);
            timeString = timeString + this.nextTime?.toFormat('a');  // (this.nextTime.weekday === DateTime.now().weekday ? this.daytimeString : 
            this._startTimeString = timeString;
        }
        return this._startTimeString;
    }

    private _daytimeString?: string | null = null;
    get daytimeString(): string | null {
        // TODO https://moment.github.io/luxon/api-docs/index.html#datetimetorelativecalendar
        if (isNil(this._daytimeString)) {
            const nowMeridiem = DateTime.now().toFormat('a');
            const past = DateTime.now() > <any>this.nextTimeEnd;

            if (past) {
                switch (this.nextTime?.toFormat('a')) {
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
                switch (this.nextTime?.toFormat('a')) {
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

    private _nextTimeEnd: DateTime | null = null;
    get nextTimeEnd(): DateTime | null {
        if (isNil(this._nextTimeEnd)) {
            this._nextTimeEnd = <any>this.nextTime?.plus({ minutes: this.duration });
        }
        return this._nextTimeEnd;
    }

    // Determine the next DateTime that this meeting occurs
    // returned DateTime will be in local timezone
    private _nextTime: DateTime | null = null;
    get nextTime(): DateTime {
        if (isNil(this._nextTime)) {
            if (this.recurrence.type === RecurrenceType.DAILY) {
                const now = DateTime.now();
                const nextTime = DateTime
                    .fromMillis(this.startTime).setZone(this.timezone)
                    .set({
                        year: now.year,
                        month: now.month,
                        day: now.day
                    }).setZone('local');
                if (nextTime > now) {
                    // this meeting happens later today, adjust now to upcoming hh:mm
                    this._nextTime = nextTime;
                } else {
                    // this meeting occurred earlier today, move startTime to tomorrow at adjusted schedule hh:mm
                    this._nextTime = nextTime.plus({ days: 1 });
                }
            } else {
                // Weekly meetings use startDateTime to compare with now
                const now = Meeting.makeThat70sDateTime() as any;
                const startDateTime = DateTime.fromMillis(this.startDateTime);

                let next = DateTime.now().set({
                    hour: startDateTime.hour,
                    minute: startDateTime.minute,
                    weekday: startDateTime.weekday
                });

                if (next < DateTime.now()) next = next.plus({ weeks: 1 });
                this._nextTime = next;
            }
        }

        return <any>this._nextTime;
    }

    private _startTimeFormat?: string | null = null;
    get startTimeFormat(): string | null {
        if (isNil(this._startTimeFormat)) {
            this._startTimeFormat = this.tConvert(this.startTimeFormatLocal?.toFormat("HH:mm a"));
        }
        return <any>this._startTimeFormat;
    }

    private _startTimeFormatLocal?: DateTime | null = null;
    get startTimeFormatLocal(): DateTime | null {
        if (isNil(this._startTimeFormatLocal)) {
            try {
                const start = DateTime.fromObject({
                    hour: Number.parseInt(this.time24h?.split(':')[0]),
                    minute: Number.parseInt(this.time24h?.split(':')[1])
                }, { zone: this.timezone }).setZone('local');
                this._startTimeFormatLocal = start;
            } catch (error) {
                // console.error(error);
                // TODO
                // return;
                this._startTimeFormatLocal = <any>null;
            }
        }
        return <any>this._startTimeFormatLocal;
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

    constructor(meeting?: any) {
        super(meeting);
        this.initialize(this, meeting);

        this.recurrence = new Recurrence(meeting.recurrence);

        this.updateCounters();
    }

    refresh() {
        this._tminus = null;
        this._endsIn = null;
        this._isLive = null;
        this._nextTime = null;
        this._nextTimeEnd = null;
        this._startTimeFormat = null;
        this._startTimeFormatLocal = null;
        this._startTimeString = null;
        this._daytimeString = null;
        this.updateCounters();
    }

    toObject(): IMeeting {
        // list properties not serialized into the database
        const exclude = ['tMinus', '_tminus',
            'endsIn', '_endsIn',
            'backgroundUpdateEnabled',
            'isVerified',
            'tags', 'tagsString',
            'meetingTypesString',
            'meetingSub', 'weekdays', 'weekday',
            'startTimeString', 'daytimeString', 'startTimeFormat', 'startTimeFormatLocal',
            'isLive', 'nextDateTime', 'nextTime', 'nextTimeEnd'];

        const json = super.toObject([...exclude, ...exclude.map(e => `_${e}`)]);
        return json;
    }

    public isLiveAt(dateTime: DateTime): boolean {
        dateTime = Meeting.makeThat70sTime(dateTime);   // put required local time: dateTime into That70sTime
        let isLive = false;
        if (this.recurrence.type === RecurrenceType.DAILY) {
            const _dateTime = Meeting.makeThat70sTime(dateTime).toMillis();
            isLive = this.startTime <= _dateTime && _dateTime <= this.startTime + this.duration * 60 * 1000;      // start <= now <= end
        } else {
            const _dateTime = Meeting.makeThat70sDateTime(dateTime).toMillis();
            isLive = (this.continuous) || (this.startDateTime <= _dateTime) && (_dateTime <= this.startDateTime + this.duration * 60 * 1000);      // start <= now <= end
        }

        if (!isLive && this.endTime === -1) {   // 0
            const startTime = DateTime.fromMillis(this.startTime);
            const startHour = startTime.startOf('hour').toMillis();
            const endHour = startTime.endOf('hour').toMillis();
            const _dateTime = Meeting.makeThat70sTime(dateTime).toMillis();

            isLive = startHour < _dateTime && _dateTime < endHour;
        }
        return isLive;
    }

    // DEPRECATED 
    setFeedback(feedback: any) {
        // if (feedback.success) {
        //     this.verified_count++;

        //     // TODO add logic to set verified taking into account bogus 'nothing' reports
        //     this.verified = true;
        // } else if (feedback.nothing) {
        //     // TODO this can happen if user tries to join at very end of meeting already ended
        //     this.nothing_count++;
        //     if (this.nothing_count > this.verified_count) this.verified = false;
        // } else if (feedback.password) {
        //     this.password_count++;
        // }
    }

    /////////////////////////////////////////////////////////////////////
    // just having fun making structures instead of writing code...... //
    /////////////////////////////////////////////////////////////////////

    // ISO specifies the dow ordering and numbering as 
    // see https://en.wikipedia.org/wiki/ISO_week_date
    // Properties names are WeekdayLong or ISO numeric string index
    // Property values are the corresponding 70's DayOfWeek
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

    /*
        Converts weekday dates for week of 1/1/1970 into iso weekday indexes
        ie  1/1/1970 is a Thursday which is iso day of week 4
            1/7/1970 is a Wednesday which is iso day of week 3
    */
    static _70s_dow_2_iso_weekday = {
        'Thursday': 4,
        '1': 4,
        'Friday': 5,
        '2': 5,
        'Saturday': 6,
        '3': 6,
        'Sunday': 7,
        '4': 7,
        'Monday': 1,
        '5': 1,
        'Tuesday': 2,
        '6': 2,
        'Wednesday': 3,
        '7': 3
    };

    // Monday = 1
    public static get today_weekdayLong(): string {
        // @ts-ignore
        return Meeting.weekdays[DateTime.local().weekday]
    }
    static weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    static iso_weekday_2_iso_index(weekday: any) { return Meeting.weekdays.indexOf(weekday) + 1 }
    static oneDayMillis = 86400000;  // 24 * 60 * 60 * 1000
    static oneWeekMillis = (7 * (Meeting.oneDayMillis));

    // TODO review all these updates...seems some of them are import updates and unnecessary here....
    public update(): Meeting {
        this.updateCounters();
        this.updateProperties();
        // this.updateTags();
        this.updateDayTime();

        this.updated = DateTime.now().toMillis();

        return this;
    }

    // DEPRECATED
    public updateCounters() {
        // this.isVerified = this.verified_count > (this.password_count + this.waiting_count + this.nothing_count);
    }

    public updateProperties() {
        // remove ' ' and '-' from zid
        this.zid = this.zid.replace(/\s/g, '').replace('-', '');

        if (this.meetingTypes.find(mt => mt === '24/7')) this.continuous = true;
        if (this.meetingTypes.find(mt => mt === 'C')) this.closed = true;

        if (this.meetingTypes.find(mt => mt === 'M')) {
            this.restricted = true;
            this.restrictedDescription = "Male Only";
        }

        if (this.meetingTypes.find(mt => mt === 'W')) {
            this.restricted = true;
            this.restrictedDescription = "Female Only";
        }
    }

    public updateTags() {
        this.tags_custom_ = this.tags_custom.map(t => t.toLowerCase());

        // TODO improve this filtering with word filtering
        const filter = (t: string) => {
            return !isNil(t) && !isEmpty(t) && t.length > 2 && !([null, 'Temp', 'not', 'the', 'and', 'but', 'for', 'nor', 'yet', 'from', 'are'].includes(t))
        };

        this.tags_description_ = concat(split(this.description, ' ')).map(t => t.toLowerCase()).filter(filter);
        this.tags_name_ = concat(split(this.name, ' ')).map(t => t.toLowerCase()).filter(filter);
        this.tags_location_ = concat(split(this.location, ', ')).filter(mt => !isNil(mt) && !isEmpty(mt)); // .map(t => t.toLowerCase()).filter(filter);

        this.tags_ = concat(this.meetingTypes.map(mt => mt.toLowerCase()), this.tags_custom_, this.tags_name_, this.tags_location_, this.tags_description_).filter(mt => !isNil(mt) && !isEmpty(mt));

        // this.description_links= [];
    }

    public updateDayTime() {
        try {
            if (this.recurrence.type === RecurrenceType.CONTINUOUS) {
                this.continuous = true;
                this.recurrence.weekly_day = '';
                this.recurrence.weekly_days = [];
                this.startTime = -1;
                this.endTime = -1;
                this.startDateTime = -1;
                this.endDateTime = -1;
                this.startTime$ = '24/7';
                this.time24h = '00:00';
            } else if (this.recurrence.type === RecurrenceType.DAILY) {
                // If 'daily' meeting, set weekly_days to all days
                // @ts-ignore
                this.recurrence.weekly_day = '';
                this.recurrence.weekly_days = <any>cloneDeep(Meeting.weekdays); // TODO for future possible use Zoom api?
                this.startTime = Meeting.makeThat70sTime(this.time24h, this.timezone).toMillis();
                this.startTime$ = DateTime.fromMillis(this.startTime).setZone(this.timezone).toFormat('tttt');
                this.endTime = this.startTime + this.duration * 60 * 1000;  // TODO config
                this.startDateTime = -1;
                this.endDateTime = -1;
            } else {
                // @ts-ignore
                if (!this.recurrence.weekly_day) throw new Error('invalid weekly_day');
                this.recurrence.weekly_days = [this.recurrence.weekly_day];    // TODO for future possible use Zoom api?
                this.startDateTime = <any>Meeting.makeFrom24h_That70sDateTime(this.time24h, this.timezone, this.recurrence.weekly_day)?.toMillis();
                this.startTime$ = DateTime.fromMillis(this.startDateTime).setZone(this.timezone).toFormat('tttt');
                this.endDateTime = this.startDateTime + this.duration * 60 * 1000;
                this.startTime = -1;
                this.endTime = -1;
            }

            // Did endTime roll past 24h?
            if (this.endTime > Meeting.oneDayMillis) {
                this.endTime = this.endTime - Meeting.oneDayMillis;
            }

            // Did endDateTime roll past Jan 7th?
            if (this.endDateTime > Meeting.oneWeekMillis) {
                this.endDateTime = this.endDateTime - Meeting.oneWeekMillis;
            }

        } catch (error) { }
    }

    /*
        parameters
        time:   may be a 24h 'hh:mm' string
                may be a ISO string
                may be milliseconds
                may be a DateTime

        timezone: timezone of returned DateTime

        function returns a DateTime constructed from time with date set to 1/1/1970 in UTC
    */
    static makeThat70sTime(time?: any, timezone?: string, utc?: boolean): DateTime {
        time = time ? time : DateTime.local();
        if (!isNil(time)) {
            switch (typeof time) {
                case 'string':  // 'hh:mm' or ISO string
                    time = time.length !== 'hh:mm'.length ? DateTime.fromISO(time)
                        : Meeting.makeFrom24h_That70sDateTime(
                            time,
                            timezone as any,
                            'Thursday',
                            utc);
                    break;
                case 'number':
                    time = Meeting.makeThat70sDateTime(DateTime.fromMillis(time));
                    break;
                case 'object':
                    time = Meeting.makeThat70sDateTime(
                        time,
                        Meeting.iso_weekday_2_70s_dow['Thursday'],
                        utc);
                    break;
                default:
                    debugger;
            }
        }
        return time;
    }

    static makeThat70sDateTime(dateTime?: DateTime, iso_weekday?: any, utc?: boolean): DateTime {
        let dt = isNil(dateTime) ? DateTime.local() : dateTime;

        try {
            // @ts-ignore
            let day: any = iso_weekday ? iso_weekday : Meeting.iso_weekday_2_70s_dow[dt.weekdayLong];

            let dateTime = DateTime
                .fromObject({
                    hour: dt.hour ? dt.hour : 0,
                    minute: dt.minute ? dt.minute : 0,
                    second: 0,
                    millisecond: 0
                }, { zone: dt.zoneName ? dt.zoneName : 'local' })
                .set({
                    year: 1970,
                    month: 1,
                    day
                });

            if (utc) dateTime = dateTime.setZone('UTC');
            return dateTime;
        } catch (error) {
            throw error;
        }
    }

    static makeFrom24h_That70sDateTime(time24h: string, zone: string, weekday: string, utc?: boolean): DateTime {
        try {
            let hour = Number.parseInt(time24h.split(':')[0]);
            let minute = Number.parseInt(time24h.split(':')[1]);
            // @ts-ignore
            let day: any = Meeting.iso_weekday_2_70s_dow[weekday];

            let dateTime = DateTime
                .fromObject({
                    hour,
                    minute,
                    second: 0,
                    millisecond: 0
                }, { zone })
                .set({
                    year: 1970,
                    month: 1,
                    day
                })

            if (utc) dateTime = dateTime.setZone('UTC');
            return dateTime;
        } catch (error) {
            throw error;
        }
    }

    // Move this search into the appropriate specific weekday of 1/1/1970
    static makeThat70sWeekday(start: DateTime, end: DateTime, weekday: any): { start: DateTime, end: DateTime, _start: string, _end: string } {
        // get weekday to move this search to
        weekday = weekday !== SpecificDay.today ? weekday : DateTime.local().weekday;

        // midnight indicates start happens on previous day
        const midnight = start.weekday != end.weekday;

        // align weekday into 70's dow
        // @ts-ignore
        weekday = Meeting.iso_weekday_2_70s_dow[weekday];

        // save original size of window
        // here is the bug!  (diff < 0) === true!
        // const diff = end.diff(start);   // save start-end diff so we know where to put end (if on a different day)


        // TODO MIDNIGHT-BUG chased damn midnight bug to here and then the clock struck 1 and it's gone
        // was a good one too....was on the Wed/Thu DateTime split too.
        // fix tomorrow night....

        // start weekday - if midnight and weekday is the 1st, roll weekday to 7th otherwise day before weekday
        const _startWeekday = !midnight ? weekday : weekday === 1 ? 7 : weekday - 1;


        const _start: DateTime = start.set({ day: _startWeekday });              // set new start weekday
        const _end: DateTime = end.set({ day: weekday }); // adjust end to new start
        return {
            start: _start,
            end: _end,
            // DEBUG data
            _start: _start.toLocaleString(DateTime.DATETIME_SHORT),
            _end: _end.toLocaleString(DateTime.DATETIME_SHORT)
        };
    }

    // https://stackoverflow.com/questions/13898423/javascript-convert-24-hour-time-of-day-string-to-12-hour-time-with-am-pm-and-no/13899011
    tConvert(time: any) {

        // update this to use luxon

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