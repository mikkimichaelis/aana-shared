import { DateTime } from "luxon";
import { IMeeting, IUser } from "../models";
import { IId } from "../models/id.class";
import { IRecurrence, Recurrence } from "./recurrence";
import { cloneDeep, concat, isEmpty, isNil, join, split } from 'lodash';
import { Id } from '../models/id.class';
import { SpecificDay } from '../models/search-settings';
import { User } from '../models/user.class';
import { Base, IBase } from "../models/base.class";

export interface IMeetingDateTime extends IBase {
   
    duration: number;

    // startTime/endTime creates a window of time which can be searched for containing a specific point in time 
    // this is used to search where specificDay is any
    startTime: number;              // Millisecond UTC 0 time offset of 1/1/1970 + timezone + startTime
    startTime$: string;             // 'ffff' formatted startTime in timezone

    // startDateTime is a point in time this meeting starts which can be searched for within a window of time
    // this is used to search for meetings withing a specific day
    startDateTime: number;          // Absolute start DateTime in UTC of Meeting startTime + weekday in Meeting timezone 

    // Non serialized getter properties
    isLive: boolean | null;
    tMinus: any;
    endsIn: any;
    startTimeString: string | null;
    nextTime: DateTime | null;
    recurrence: IRecurrence;
}

export class MeetingDateTime extends Base implements IMeetingDateTime {
    
    public recurrence: IRecurrence = {} as IRecurrence;

    public duration: number = 60;
    public continuous: boolean = false;

    // these fields should only be populated by Daily meetings
    // startTime/endTime creates a window of time which can be searched for containing a specific point in time on any day 
    // this is used to search where meetings are at a specific time on any day
    public startTime: number = 0;      // Millisecond UTC 0 time offset of 1/1/1970 + timezone + startTime
    public startTime$: string = '';

    // these fields should only be populated by Weekly meetings
    // startDateTime is a point in time this meeting starts which can be searched for within a window of time
    // this is used to search for meetings within a specific day
    public startDateTime: number = 0;  // Absolute start DateTime in UTC of Meeting startTime + weekday in Meeting timezone 

    // - Mills till isLive ends
    // + Mills till isLive starts
    private _tminus?: number | null = null;
    public get tMinus(): number | null {
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
    public get endsIn(): number {    // TODO make Duration
        if (isNil(this._endsIn)) {
            if (this.continuous) {
                this._endsIn = Number.MAX_VALUE;
            } else if (this.isLive) {
                if (this.recurrence.type === 'Daily') {
                    const now = MeetingDateTime.makeThat70sTime().toMillis();
                    this._endsIn = this.endTime - now;
                    // console.log(`this.endTime: ${this.endTime} \nnow: ${now}`);
                    // console.log(`$(this._isLiveEnd: ${this._endsIn}`)
                } else {
                    const now = <any>MeetingDateTime.makeThat70sDateTime()?.toMillis();
                    this._endsIn = this.endDateTime - now;
                }
            } else {
                this._endsIn = null;
            }
        }
        return <any>this._endsIn;
    }

    private _isLive?: boolean | null = null;
    public get isLive(): boolean | null {
        if (isNil(this._isLive)) {
            if (this.recurrence.type === 'Daily') {
                const now = MeetingDateTime.makeThat70sTime().toMillis();
                this._isLive = (this.continuous) || (this.startTime <= now) && (now <= this.endTime);      // start <= now <= end
            } else {
                const now = <any>MeetingDateTime.makeThat70sDateTime()?.toMillis();
                this._isLive = (this.continuous) || (this.startDateTime <= now) && (now <= this.endDateTime);      // start <= now <= end
            }

        }
        return this.continuous || this._isLive;
    }

    private _startTimeString?: string | null = null;
    public get startTimeString(): string | null {
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

    // Determine the next DateTime that this meeting occurs
    // returned DateTime will be in local timezone
    private _nextTime: DateTime | null = null;
    public get nextTime(): DateTime {
        if (isNil(this._nextTime)) {
            if (this.recurrence.type === 'Daily') {
                // Daily meetings use startTime to compare with now time
                const now = MeetingDateTime.makeThat70sTime();
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
                const now = MeetingDateTime.makeThat70sDateTime();
                const startDateTime = DateTime.fromMillis(this.startDateTime);
                const next = DateTime.now().set({
                    hour: startDateTime.hour,
                    minute: startDateTime.minute,
                    weekday: startDateTime.weekday
                });
                if (startDateTime > now) {
                    this._nextTime = next;
                } else {
                    this._nextTime = next.plus({ weeks: 1 });
                }
            }
        }

        return <any>this._nextTime;
    }

    private _startTimeFormat?: string | null = null;
    private get startTimeFormat(): string | null {
        if (isNil(this._startTimeFormat)) {
            this._startTimeFormat = this.tConvert(this.startTimeFormatLocal?.toFormat("HH:mm a"));
        }
        return <any>this._startTimeFormat;
    }

    // defunct
    private _startTimeFormatLocal?: DateTime | null = null;
    private get startTimeFormatLocal(): DateTime | null {
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

    // Meeting ISO weekday, 1-7, where 1 is Monday and 7 is Sunday
    private get weekday(): number {
        // @ts-ignore
        return Meeting.iso_weekday_2_70s_dow[this.recurrence.weekly_day];
    }

    // defunct
    private _daytimeString?: string | null = null;
    private get daytimeString(): string | null {
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
    private get nextTimeEnd(): DateTime | null {
        if (isNil(this._nextTimeEnd)) {
            this._nextTimeEnd = <any>this.nextTime?.plus({ minutes: this.duration });
        }
        return this._nextTimeEnd;
    }

    private endDateTime: number = MeetingDateTime.oneWeekMillis;
    private timezone: string = "America/New_York";
    private time24h: string = "00:00"; 
    private endTime: number = 0;        // startTime + duration

    constructor(meeting: IMeeting) {
        super();
        this.initialize(this, meeting);
        this.updateDayTime();
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
    }

    toObject(): IMeetingDateTime {
        // list properties that are static or computed (not serialized into the database)
        const exclude = ['tMinus', '_tminus',
            'endsIn', '_endsIn',
            'isVerified',
            'backgroundUpdateEnabled',
            'tags', 'tagsString',
            'meetingTypesString',
            'meetingSub', 'weekdays', 'weekday',
            'startTimeString', 'daytimeString', 'startTimeFormat', 'startTimeFormatLocal',
            'isLive', 'nextDateTime', 'nextTime', 'nextTimeEnd'];

        return super.toObject([...exclude, ...exclude.map(e => `_${e}`)]);
    }

    /////////////////////////////////////////////////////////////////////
    // just having fun making structures instead of writing code...... //
    /////////////////////////////////////////////////////////////////////

    // ISO specifies the dow ordering and numbering as https://en.wikipedia.org/wiki/ISO_week_date
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
    static iso_weekday_2_iso_index(weekday: any) { return MeetingDateTime.weekdays.indexOf(weekday) + 1 }
    static oneDayMillis = 86400000;  // 24 * 60 * 60 * 1000
    static oneWeekMillis = (7 * (MeetingDateTime.oneDayMillis));

    private updateDayTime() {
        try {
            if (this.recurrence.type === 'Continuous') {
                this.recurrence.weekly_day = '';
                this.recurrence.weekly_days = [];
                this.startTime = -1;
                this.endTime = -1;
                this.startDateTime = -1;
                this.endDateTime = -1;
                this.startTime$ = '24/7';
                this.time24h = '00:00';
            } else if (this.recurrence.type === 'Daily') {
                // If 'daily' meeting, set weekly_days to all days
                // @ts-ignore
                this.recurrence.weekly_day = '';
                this.recurrence.weekly_days = <any>cloneDeep(MeetingDateTime.weekdays); // TODO for future possible use Zoom api?
                this.startTime = MeetingDateTime.makeThat70sTime(this.time24h, this.timezone).toMillis();
                this.startTime$ = DateTime.fromMillis(this.startTime).setZone(this.timezone).toFormat('tttt');
                this.endTime = this.startTime + this.duration * 60 * 1000;  // TODO config
                this.startDateTime = -1;
                this.endDateTime = -1;
            } else {
                // @ts-ignore
                if (!this.recurrence.weekly_day) throw new Error('invalid weekly_day');
                this.recurrence.weekly_days = [this.recurrence.weekly_day];    // TODO for future possible use Zoom api?
                this.startDateTime = <any>MeetingDateTime._makeFrom24h_That70sDateTime(this.time24h, this.timezone, this.recurrence.weekly_day)?.toMillis();
                this.startTime$ = DateTime.fromMillis(this.startDateTime).setZone(this.timezone).toFormat('tttt');
                this.endDateTime = this.startDateTime + this.duration * 60 * 1000;
                this.startTime = -1;
                this.endTime = -1;
            }

        } catch (error) {}
    }

    static makeThat70sTime(time?: any, timezone?: string): DateTime {
        let t: DateTime | null = DateTime.local();
        if (!isNil(time)) {
            switch (typeof time) {
                case 'string':  // 'hh:mm' or ISO string
                    t = time.length !== 'hh:mm'.length ? DateTime.fromISO(time)
                        : MeetingDateTime.makeFrom24h_That70sDateTime(
                            Number.parseInt(time?.split(':')[0]),
                            Number.parseInt(time?.split(':')[1]),
                            // @ts-ignore
                            timezone,
                            'Thursday');
                    break;
                case 'number':
                    t = MeetingDateTime.makeThat70sDateTime(DateTime.fromMillis(time));
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

    static makeThat70sDateTime(dateTime?: DateTime, iso_weekday?: any): DateTime {
        let dt = isNil(dateTime) ? DateTime.local() : dateTime;

        try {
            // @ts-ignore
            let day: any = iso_weekday ? iso_weekday : Meeting.iso_weekday_2_70s_dow[dt.weekdayLong];
            dt = DateTime.fromObject({
                year: 1970,
                month: 1,
                day: day,
                hour: dt.hour ? dt.hour : 0,
                minute: dt.minute ? dt.minute : 0,
                second: dt.second ? dt.second : 0,
            }, { zone: dt.zoneName ? dt.zoneName : 'local' });
            // console.log(dt.toISO());
            return dt;
        } catch (error) {
            // console.log(`makeThat70sDateTime(): ERROR ${error.message}`);
            throw error;
        }
    }

    static makeFrom24h_That70sDateTime(hour: number, minute: number, timezone: string, weekday: string): DateTime {
        try {
            // @ts-ignore
            let day: number = Meeting.iso_weekday_2_70s_dow[weekday];
            return DateTime.now().setZone(timezone).set({
                year: 1970,
                month: 1,
                day: day,
                hour: hour,
                minute: minute
            });
        } catch (error) {
            // console.log(`makeThat70sDateTime(): ERROR ${error.message}`);
            throw error;
        }
    }

    static _makeFrom24h_That70sDateTime(time24h: string, timezone: string, weekday: string): DateTime {
        return this.makeFrom24h_That70sDateTime(Number.parseInt(time24h?.split(':')[0]),
            Number.parseInt(time24h?.split(':')[1]),
            timezone,
            weekday);
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