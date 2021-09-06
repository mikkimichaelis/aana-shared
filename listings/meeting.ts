import { cloneDeep, concat, isEmpty, isNil, join, split } from 'lodash';
import { DateTime } from 'luxon';
import { User } from '../models/user.class';
import { Id } from '../models/id.class';
import { IRecurrence, Recurrence } from './recurrence';
import { SpecificDay } from '../listings/search-settings';
import { IMeeting } from './imeeting';
// import { environment } from 'src/environments/environment';
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

    isVerified: boolean = false;

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

    parent: string = '';
    recurrence: IRecurrence = new Recurrence();
    siblings: string[] = [];
    
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
        // if (this._tminus === 0) debugger;
        return this._tminus;
    }

    private _endsIn?: number | null = null;
    get endsIn(): number {    // TODO make Duration
        if (isNil(this._endsIn)) {
            if (this.continuous) {
                this._endsIn = null;
            } else if (this.isLive) {
                if (this.recurrence.type === 'Daily') {
                    const now = Meeting.makeThat70sTime().toMillis();
                    this._endsIn = this.endTime - now;
                    // console.log(`this.endTime: ${this.endTime} \nnow: ${now}`);
                    // console.log(`$(this._isLiveEnd: ${this._endsIn}`)
                } else {
                    const now = <any>Meeting.makeThat70sDateTime()?.toMillis();
                    this._endsIn = this.endDateTime - now;
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
            if (this.recurrence.type === 'Daily') {
                const now = Meeting.makeThat70sTime().toMillis();
                this._isLive = (this.continuous) || (this.startTime <= now) && (now <= this.endTime);      // start <= now <= end
            } else {
                const now = <any>Meeting.makeThat70sDateTime()?.toMillis();
                this._isLive = (this.continuous) || (this.startDateTime <= now) && (now <= this.endDateTime);      // start <= now <= end
            }

        }
        return this._isLive;
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
            if (this.recurrence.type === 'Daily') {
                // Daily meetings use startTime to compare with now time
                const now = Meeting.makeThat70sTime();
                const startTime = DateTime.fromMillis(this.startTime);
                const next = DateTime.now().set({
                    hour: startTime.hour,
                    minute: startTime.minute
                });
                if (startTime > now) {
                    // this meeting happens later today, adjust now to upcoming hh:mm
                    this._nextTime = next;
                } else {
                    // this meeting occurred earlier today, move startTime to tomorrow at adjusted schedule hh:mm
                    this._nextTime = next.plus({ days: 1 });
                }
            } else {
                // Weekly meetings use startDateTime to compare with now
                const now = <any>Meeting.makeThat70sDateTime();
                const startDateTime = DateTime.fromMillis(this.startDateTime);
                const next = DateTime.now().set({
                    hour: startDateTime.hour,
                    minute: startDateTime.minute,
                    weekday: startDateTime.weekday
                });
                if (startDateTime > now) {
                    this._nextTime = next;
                } else {
                    this._nextTime = next.plus({ weeks: 1});
                }
                
            }
        }

        return <any>this._nextTime;
    }

    private _startTimeFormat?: string | null = null;
    get startTimeFormat(): string | null {
        if (isNil(this._startTimeFormat)) {
            this._startTimeFormat = this.tConvert(this.startTimeFormatLocal?.toFormat("HH:MM a"));
        }
        return <any>this._startTimeFormat;
    }

    private _startTimeFormatLocal?: DateTime | null = null;
    get startTimeFormatLocal(): DateTime | null {
        if (isNil(this._startTimeFormatLocal)) {
            try {
                const start = DateTime.fromObject({
                    hour: Number.parseInt(this.time24h.split(':')[0]),
                    minute: Number.parseInt(this.time24h.split(':')[1]),
                    zone: this.timezone,
                }).setZone('local');
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

    constructor(meeting?: IMeeting) {
        super(meeting);
        this.initialize(this, meeting);

        this.backgroundUpdate();

        // console.log(JSON.stringify({
        //     tMinus: this.tMinus,
        //     endsIn: this.endsIn,
        //     isLive: this.isLive,
        //     nextTime: this.nextTime,
        //     nextTimeEnd: this.nextTimeEnd,
        //     startTimeFormat: this.startTimeFormat,
        //     startTimeFormatLocal: this.startTimeFormatLocal,
        //     startTimeString: this.startTimeString,
        //     daytimeString: this.daytimeString
        // }, null, 3))
    }

    public destroy() {
        this.backgroundUpdateEnabled = false
    }

    backgroundUpdateEnabled = true;
    backgroundUpdate() {
        if (this.backgroundUpdateEnabled) {
            
            // start by updating
            this.updateCounters();

            // get the next 1 minute mark from now
            const now = DateTime.local().toMillis();
            const eom = DateTime.fromMillis(now).endOf('minute').toMillis() + 1;
            const random = Math.floor((Math.random() * (10 - 0) + 0) * 10);
            const timeout = eom - now + random;


            // get the next 30 minute mark from now
            // const now = DateTime.local().toMillis();
            // const eoh = DateTime.fromMillis(now).endOf('hour').toMillis() + 1;
            // const eohh = eoh - (30 * 60 * 1000); // 30min
            // const random = Math.floor((Math.random() * (10 - 0) + 0) * 1000);
            // const timeout = (eohh > now ? eohh : eoh) - now + random;

            setTimeout(() => {
                // clear cached property

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
                // TODO console.log(`${this.name}: isLive: ${this.isLive} nextTime: ${this.nextTime?.toISOTime()}`);

                this.backgroundUpdate()
            }, timeout);
        }
    }

    toObject(): IMeeting {
        // list properties that are static or computed (not serialized into the database)
        const exclude = [   'tMinus', '_tminus', 
                            'endsIn', '_endsIn', 
                            'isVerified', 
                            'backgroundUpdateEnabled', 
                            'tags', 'tagsString',
                            'meetingTypesString', 
                            'meetingSub', 'weekdays', 'weekday', 
                            'startTimeString', 'daytimeString', 'startTimeFormat', 'startTimeFormatLocal', 
                            'isLive', 'nextDateTime', 'nextTime', 'nextTimeEnd'];

                            // updateDayTime(): void;
                            // updateTags(): void;
                            // isHome(user: User): boolean;       // TODO remove

        return super.toObject([...exclude, ...exclude.map(e => `_${e}`)]);
    }

    setFeedback(feedback: any) {
        if (feedback.success) {
            this.verified_count++;

            // TODO add logic to set verified taking into account bogus 'nothing' reports
            this.verified = true;
        } else if (feedback.nothing) {
            // TODO this can happen if user tries to join at very end of meeting already ended
            this.nothing_count++;
            if (this.nothing_count > this.verified_count) this.verified = false;
        } else if (feedback.password) {
            this.password_count++;
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
    static weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    static iso_weekday_2_iso_index(weekday: any) { return Meeting.weekdays.indexOf(weekday) + 1 }
    static oneDayMillis = 86400000;  // 24 * 60 * 60 * 1000
    static oneWeekMillis = (7 * (Meeting.oneDayMillis));

    isHome(user: User): boolean {
        return user.homeMeeting === this.id;
    }

    public update(): Meeting {
        this.updateCounters();
        this.updateProperties();
        this.updateTags();
        this.updateDayTime();

        return this;
    }

    public updateCounters() {
        this.isVerified = this.verified_count > (this.password_count + this.waiting_count + this.nothing_count);
    }

    public updateProperties() {
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

        this.continuous = this.meetingTypes.find(mt => mt === '24/7') === undefined ? false : true;
        this.tags_description_ = concat(split(this.description, ' ')).map(t => t.toLowerCase()).filter(filter);
        this.tags_name_ = concat(split(this.name, ' ')).map(t => t.toLowerCase()).filter(filter);
        this.tags_location_ = concat(split(this.location, ', ')).filter(mt => !isNil(mt) && !isEmpty(mt)); // .map(t => t.toLowerCase()).filter(filter);

        this.tags_ = concat(this.meetingTypes.map(mt => mt.toLowerCase()), this.tags_custom_, this.tags_name_, this.tags_location_, this.tags_description_).filter(mt => !isNil(mt) && !isEmpty(mt));

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
                this.recurrence.weekly_days = <any>cloneDeep(Meeting.weekdays); // TODO for future possible use Zoom api?
                this.startTime = Meeting.makeThat70sTime(this.time24h, this.timezone).toMillis();
                this.endTime = this.startTime + this.duration * 60 * 1000;  // TODO config
                this.startDateTime = 0;
                this.endDateTime = 0;
            } else {
                // @ts-ignore
                if (!this.recurrence.weekly_day) throw new Error('invalid weekly_day');
                this.recurrence.weekly_days = [this.recurrence.weekly_day];    // TODO for future possible use Zoom api?
                this.startDateTime = <any>Meeting._makeFrom24h_That70sDateTime(this.time24h, this.timezone, this.recurrence.weekly_day)?.toMillis();
                this.endDateTime = this.startDateTime + this.duration * 60 * 1000;
                this.startTime = 0;
                this.endTime = 0;
            }

        } catch (error) {
            // console.error(error);
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

    static makeThat70sTime(time?: any, timezone?: string): DateTime {
        let t: DateTime | null = DateTime.local();
        if (!isNil(time)) {
            switch (typeof time) {
                case 'string':  // 'hh:mm'
                    t = time.length !== 5 ? DateTime.fromISO(time)
                        : Meeting.makeFrom24h_That70sDateTime(
                            Number.parseInt(time.split(':')[0]),
                            Number.parseInt(time.split(':')[1]),
                            // @ts-ignore
                            timezone,
                            'Thursday');
                    break;
                case 'number':
                    t = Meeting.makeThat70sDateTime(DateTime.fromMillis(time));
                    break;
                case 'object':
                    t = time;
                    break;
                default:
                    // debugger;
            }
        }

        // time only is always on 1/1/1970
        // @ts-ignore
        t = t.set({ year: 1970, month: 1, day: 1 });
        return t;
    }

    static makeThat70sDateTime(dateTime?: DateTime, iso_weekday?: any): DateTime | null {
        let dt = isNil(dateTime) ? DateTime.local() : dateTime;

        try {
            // @ts-ignore
            let day: any = isNil(iso_weekday) ? Meeting.iso_weekday_2_70s_dow[dt.weekdayLong] : Meeting.iso_weekday_2_70s_dow[iso_weekday]
            dt = DateTime.fromObject({
                year: 1970,
                month: 1,
                day: day,
                hour: dt.hour ? dt.hour : 0,
                minute: dt.minute ? dt.minute : 0,
                second: dt.second ? dt.second : 0,
                zone: dt.zoneName ? dt.zoneName : 'local',
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

    // TODO wtf?
    static makeThat70sWeekday(start: DateTime, end: DateTime, weekday: any): { start: DateTime, end: DateTime } {
        // get weekday to move this search to
        weekday = weekday !== SpecificDay.today ? weekday : DateTime.local().weekday;

        // midnight indicates start happens on previous day
        const midnight = start.weekday != weekday;

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
        return { start: _start, end: _end };
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