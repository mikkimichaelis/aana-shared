import { head, last } from 'lodash';
import { DateTime, Duration } from 'luxon';
import { Id, IId } from '../models/id.class';

export interface IAttendance extends IId {
    uid: string;            // User.id
    mid: string;            // Meeting.id
    zid: string;            // Zoom meeting number (same as Meeting.zid)
    uzid: string;           // Unique Zoom Meeting id for this occurrence
    zpid: string;           // Zoom Participant id
    zuid: string;           // Zoom User ID

    records: IAttendanceRecord[];
    log: string[];          // verbose translation of attendanceRecords and accounting ledger for credit

    valid: boolean;

    timezone: string;       // tz of user at time of attendance

    start: number;          // local utc millis when participation started
    start$: string;         // ISO string in timezone
    // $ meant String in BASIC long before it meant Observable.....
    end: number;            // local utc millis when participation ended
    end$: string;

    duration: number;       // millis end - start
    duration$: string;

    credit: number;         // millis valid amount of duration credited for attendance (see log)
    credit$: string;        // hh:mm:ss

    processed: number;      // server utc millis processed or null
    processed$: string;

    updated: number;        // server utc millis last updated
    updated$: string;

    created: number;        // server utc millis created

    isValid(): boolean;
    process(): Promise<boolean>; // returns success

    addRecord(record: any): void;
}

export interface IAttendanceRecord extends IId {
    status: string;     // [Zoom.MeetingStatus] || ['MEETING_ACTIVE_TRUE', 'MEETING_ACTIVE_FALSE']
    visible: boolean;   // Video Activity visible
    volume: number;     // device call volume (not media!)
    audio: boolean;     // Zoom audio connected
    loud: boolean;      // speakerphone

    local: string;      // local time string
    timestamp: number;  // UTC Millis from device
}

export class AttendanceRecord extends Id {
    status: string = '';        // client populated
    visible: boolean = true;    // client populated
    volume: number = 0;         // client populated
    audio: boolean = true;      // client populated
    loud: boolean = true;       // client populated

    local: string = DateTime.now().toFormat('ttt');
    timestamp: number = DateTime.now().toMillis();

    constructor(attendanceRecord?: any) {
        super(attendanceRecord);
        this.initialize(this, attendanceRecord);
    }
}

export class Attendance extends Id implements IAttendance {
    uid: string = '';
    mid: string = '';
    zid: string = '';
    uzid: string = '';
    zpid: string = '';
    zuid: string = '';

    records: IAttendanceRecord[] = [];
    log: string[] = [];

    timezone: string = DateTime.now().zoneName;

    start: number = DateTime.now().toMillis();                  // client populated millis
    start$: string = DateTime.now().toUTC().toFormat('FFF');    // client populated local tz datetime string

    end: number = <any>null;            // server populated millis
    end$: string = <any>null;           // server populated local tz datetime string

    duration: number = 0;               // server populated millis
    duration$: string = '00:00:00';     // server populated string

    credit: number = 0;                 // server populated millis
    credit$: string = "0";              // server populated hh:mm:ss string

    processed: number = <any>null;      // server populated millis
    processed$: string = <any>null;     // server populated local tz datetime string

    updated: number = <any>null;        // server populated millis
    updated$: string = <any>null;       // server populated local tz datetime string

    created: number = <any>null;        // server populated millis

    valid: boolean = false;             // server populated

    constructor(attendance?: any) {
        super(attendance);
        this.initialize(this, attendance);
    }

    private update() {
        this.start$ = DateTime.fromMillis(this.start).setZone(this.timezone).toFormat('FFF');
        this.end$ = DateTime.fromMillis(this.end).setZone(this.timezone).toFormat('FFF');
        this.duration$ = DateTime.fromMillis(this.duration).setZone(this.timezone).toFormat('FFF');
        this.credit$ = DateTime.fromMillis(this.credit).setZone(this.timezone).toFormat('FFF');
        this.processed$ = DateTime.fromMillis(this.processed).setZone(this.timezone).toFormat('FFF');
        this.updated$ = DateTime.fromMillis(this.updated).setZone(this.timezone).toFormat('FFF');
    }

    stamp(record: any) {

    }

    public addRecord(record: any) {
        if (['MEETING_ACTIVE_FALSE', 'MEETING_ACTIVE_TRUE]'].indexOf(record.status) == -1) {
            // update with zoom meeting values
            // these are not available for MEETING_ACTIVE_TRUE || MEETING_ACTIVE_FALSE events.
            // We must wait a few seconds after MEETING_ACTIVE_TRUE to receive
            // this data in the first ZoomVisibleTask event providing visibility status, etc.
            this.zid = record.zid;
            this.zpid = record.zpid;
            this.uzid = record.uzid;
            this.zuid = record.zuid;
        }
        this.records.push(new AttendanceRecord(record));
    }

    // Here we check for garbage
    // the garbage seems to be the time spent in the waiting room
    // 
    public isValid(): boolean {
        let valid = true;

        valid = valid && this.records.length > 2;   // require three records to be valid
        // 1 START
        // 2 IN_MEETING STATUS
        // 3 END

        // @ts-ignore
        const start = DateTime.fromMillis(head(this.records).timestamp);
        // @ts-ignore
        const end = DateTime.fromMillis(last(this.records).timestamp);

        // TODO wtf wont this work?
        // const duration: Duration = end.diff(start); 
        // valid = valid && duration.minutes > 1;  // TODO config this
        const duration = end.toMillis() - start.toMillis();
        valid = valid && duration > 60 * 1000;  // 1m - TODO config this

        return valid;
    }

    public async process(): Promise<boolean> {
        // @ts-ignore
        return new Promise<boolean>(async (resolve, reject) => {
            // try {
                this.updated = DateTime.now().toMillis();

                this.valid = this.isValid();
                if (!this.valid) {
                    return false;
                }

                this.log = [];      // be sure to clear running lists.....
                this.credit = 0;    // and counters!

                // here we create a log entry for each period (intended for support viewing)
                // a period is the time between validity changes
                let period_start: any = null;
                this.records.forEach((r, index) => {
                    let log = ``;
                    if (r.status === 'MEETING_ACTIVE_TRUE') {
                        period_start = r.timestamp;
                        this.log.push(`${r.local} START`)
                    } else if (r.status === 'MEETING_ACTIVE_FALSE') {
                        if (period_start) {
                            const duration = Duration.fromMillis(r.timestamp - period_start);
                            this.credit = this.credit + duration.toMillis();
                            this.log.push(`${r.local} END ${duration.toFormat('hh:mm:ss')} duration`);
                        }
                        period_start = null;
                    } else {
                        if (!r.visible) {
                            log = log + '!VISIBLE ';
                        }

                        if (!r.audio) {
                            log = log + '!AUDIO ';
                        }

                        if (r.volume < .4) {
                            log = log + '!VOLUME ';
                        }

                        if (log === '') {
                            if (!period_start) {
                                period_start = r.timestamp;
                                this.log.push(`${r.local} START`)
                            }
                        } else {
                            if (period_start) {
                                // end existing period
                                const duration = Duration.fromMillis(r.timestamp - period_start);
                                this.credit = this.credit + duration.toMillis();
                                this.log.push(`${r.local} END ${log} ${duration.toFormat('hh:mm:ss')} duration`);
                                period_start = null;
                            }
                        }
                    }
                });

                this.update();
                this.processed = DateTime.now().toMillis()
                this.log.push(`${DateTime.fromMillis(this.processed).setZone(this.timezone).toFormat('ttt')} PROCESSED ${this.valid} ${Duration.fromMillis(this.credit).toFormat('hh:mm:ss')} credit`)
                // Add digital signature
                
                resolve(true);
        })
    }
}