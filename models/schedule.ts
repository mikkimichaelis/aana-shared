import { DateTime } from 'luxon';
import { IId, Id } from './id.class';
import { Meeting, VerifiedStatus } from './meeting';
import { RecurrenceType } from './recurrence';

export interface ISchedule extends IId {
    hash: string;                       // computed hash of meeting details used to detect updates
    updated: number;                    // last time meeting was updated or imported or created
    active: boolean;                    // is active?
    authorized: boolean;                // is authorized?  not sure what this was intended for

    name: string;                       // name of the meeting

    mids: string[];                     // meeting ids belonging to this schedule (ordered by string compare)

    update(): ISchedule;                // update the schedule and compute hash
}

export class Schedule extends Id implements ISchedule {
    hash: string = '';
    updated: number = DateTime.now().toMillis();
    active: boolean = true;
    authorized: boolean = true;
    name: string = '';
    mids: string[] = [];

    constructor(schedule?: any) {
        super(schedule);
        this.initialize(this, schedule);

        // this.recurrence = new Recurrence(meeting?.recurrence);
    }

    public static sortMeetingsByStartTime(meetings: Meeting[]): Meeting[] {
        return meetings.sort((a, b) => {
            if (a.recurrence.type === RecurrenceType.CONTINUOUS) {
                return b.recurrence.type === RecurrenceType.CONTINUOUS ? 0 : -1;
            }
            else if (b.recurrence.type === RecurrenceType.CONTINUOUS) return 1;

            // compare by startTime
            if (a.recurrence.type === RecurrenceType.DAILY) {
                if (a.startTime < b.startTime) return -1;
                if (a.startTime > b.startTime) return 1;
            }

            // compare by startDateTime
            if (a.recurrence.type === RecurrenceType.WEEKLY) {
                if (a.startDateTime < b.startDateTime) return -1;
                if (a.startDateTime > b.startDateTime) return 1;
            }
            return 0;   // a == b
        });
    }

    public update(): ISchedule {
        this.updated = DateTime.now().toMillis();       // set new updated (exclude from hash)

        // sort mids by simple string compare
        this.mids = this.mids.sort((a: string, b: string) => {
            if (a < b) return -1;
            if (a > b) return 1;
            return 0;
        });

        const hash = this.computeHash();                // compute hash
        if (hash !== this.hash) {                       // has anything changed?
            this.hash = hash;
        }
        return this;
    }

    toObject(): ISchedule {
        // list properties not serialized into the database
        const exclude = [];
        const json = super.toObject(exclude);
        return json;
    }

    toJSON(): ISchedule {
        return this.toObject();
    }

    public computeHash(): string {
        // note ${this.updated} is excluded from the hash because it is updated every time the hash is computed
        let str = `${this.active}${this.authorized}${this.name}${this.mids.toString()}`;

        // https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
        var hash = 0,
            i, chr;
        for (i = 0; i < str.length; i++) {
            chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return `${hash}`;
    }
}


//////////////////////////////////////////////////////////////////////////////////////////
/*  This is the original Schedule class from the AANA project.  It is not used in the
    current project, but is included here for reference and nostalgia.
//////////////////////////////////////////////////////////////////////////////////////////
export interface IZoomSchedule extends ISchedule {
    aid: string;    // user id of Zoom account admin
    zid: string;
    zpw: string;
}

export interface ISchedule {
    id: string;
    gid: string;
    zoom: boolean;
    day: string;        // UI string representing dow when group occurs ie Monday
    time: string;       // UI string representing time when group occurs ie 7:00 pm
    millis: number;     // Millisecond time offset of date/time from from 1/1/1970 +0
    // offset includes dow + time in ms
    // NOTE: Timezone and UTC offset are irrelevant because the phones time will 
    // be in the same tz/utc offset as the group.  Therefore they can be ignored
    // and a comparison be performed simply on 12h a/p format, just like a humans do.
    // IE. when checking if I've arrived at a group on time and the group starts at
    // 7pm and my phone says 6:50pm, I don't check the groups tz offset, check if Daylight Savings
    // is in effect, or if I'm accidentally in the wrong timezone.  Technically my phones TZ can be
    // wrong, and that would cause problems, but thats a user error for which I'll not write code to handle.
    // I'll assume if a person is standing at a group their phone is in the same tz as the group itself.
    duration: number;   // minute duration of group
    recurring: boolean;
    lastUpdate: string;
    notes: string;
    active: boolean;
};


export class Schedule extends Id implements ISchedule {
    gid: string = '';
    zoom: boolean = false;
    day: string = '';
    time: string = '';
    duration: number = 60;
    recurring: boolean = true; // TODO verify used in scheduling algorithms
    active: boolean = true;
    notes: string = '';
    millis: number = 0;
    lastUpdate: string = DateTime.utc().toISO() as string;

    constructor(schedule?: any) {
        super(schedule);

        if (this.millis === 0) {
            // TODO i18n this
            const dow = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(this.day) + 1;
            this.millis = (Date.parse('01/' + dow.toString() + '/1970 ' + this.time + ' UTC'))
        }
    }
}
*/