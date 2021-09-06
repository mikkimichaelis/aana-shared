import { head, last } from 'lodash';
import { DateTime, Duration } from 'luxon';
import { Id, IId } from '../models/id.class';


export interface IAttendance extends IId {
    uid: string;            // User ID
    mid: string;            // Meeting.id
    zid: string;            // Zoom id
    zID: string;            // Zoom ID
    pid: string;            // Zoom meeting participation(?) id

    records: IAttendanceRecord[];

    status: string;         // 'VALID' || 'INVALID'
    log: string[];          // verbose record of attendanceRecords
    credit: number;         // millis of attendance

    local: string;          // Local pretty date
    timestamp: number;      // UTC Millis

    isGarbage(): boolean;
    process(): boolean;

    addRecord(record: any): void;
}

export class Attendance extends Id implements IAttendance {
    uid: string = '';
    mid: string = '';
    zid: string = '';
    zID: string = '';
    pid: string = '';

    records: IAttendanceRecord[] = [];

    status: string = 'INVALID';
    log: string[] = [];
    credit: number = 0;

    local: string = DateTime.now().toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS);
    timestamp: number = DateTime.now().toMillis();

    constructor(attendance?: any) {
        super(attendance);
        this.initialize(this, attendance);
    }

    public addRecord(record: any) {
        this.records.push(new AttendanceRecord(record));
    }

    // Here we check for garbage
    // attendance time > 1m
    public isGarbage(): boolean {
        let valid = true;

        valid = valid && this.records.length > 1;   // require two records to be valid

        // @ts-ignore
        const start = DateTime.fromISO(head(this.records).timestamp);
        // @ts-ignore
        const end = DateTime.fromISO(last(this.records).timestamp);
        const duration: Duration = end.diff(start);

        valid = valid && duration.minutes > 1;

        return valid;
    }

    public process(): boolean {
        this.log = [];      // be sure to clear running lists.....
        this.credit = 0;    // and counters!

        // here we create a log entry for each period (intended for support viewing)
        // a period is the time between validity changes
        let period_start: any = null;
        this.records.forEach((r, index) => {
            let log = ``;
            if (r.status === 'MEETING_ACTIVE_TRUE') {
                period_start = r.timestamp;
                this.log.push(`*PERIOD START ${r.local}`)
            } else if (r.status === 'MEETING_ACTIVE_FALSE') {
                if (period_start) {
                    const duration = Duration.fromMillis(r.timestamp - period_start);
                    this.credit = this.credit + duration.toMillis();
                    this.log.push(`*PERIOD END ${duration.toFormat('hh:mm:ss')} ${r.local}`);
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
                        this.log.push(`*PERIOD START ${r.local}`)
                    }
                } else {
                    if (period_start) {
                        // end existing period
                        const duration = Duration.fromMillis(r.timestamp - period_start);
                        this.credit = this.credit + duration.toMillis();
                        this.log.push(`*PERIOD END ${duration.toFormat('hh:mm:ss')} ${r.local} ${log}`);
                        period_start = null;
                    } 
                }
            }
        });
        return true;
    }
}

export interface IAttendanceRecord extends IId {
    status: string;     // [Zoom.MeetingStatus] || ['MEETING_ACTIVE_TRUE', 'MEETING_ACTIVE_FALSE']
    visible: boolean;   // Video Activity visible
    volume: number;     // device call volume (not media!)
    audio: boolean;     // Zoom audio connected
    loud: boolean;      // speakerphone
    local: string;      // local datetime string
    timestamp: number;  // UTC Millis
}

export class AttendanceRecord extends Id {
    status: string = '';
    visible: boolean = true;
    volume: number = 0;
    audio: boolean = true;
    loud: boolean = true;

    local: string = DateTime.local().toLocaleString(DateTime.TIME_WITH_SHORT_OFFSET);
    timestamp: number = DateTime.now().toMillis();

    constructor(attendanceRecord?: any) {
        super(attendanceRecord);
        this.initialize(this, attendanceRecord);
    }
}