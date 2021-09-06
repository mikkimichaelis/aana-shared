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
    log: string[];          // verbose record of attendanceRecords

    valid: boolean;
    credit: number;         // millis of attendance

    local: string;          // Local pretty date
    timestamp: number;      // UTC Millis

    isValid(): boolean;
    process(): boolean;

    addRecord(record: any): void;
}

export class Attendance extends Id implements IAttendance {
    uid: string = '';
    mid: string = '';
    zid: string = '';
    uzid: string = '';
    zpid: string = '';
    zuid: string = '';           // Zoom User ID

    records: IAttendanceRecord[] = [];
    log: string[] = [];

    valid: boolean = false;
    credit: number = 0;

    local: string = DateTime.now().toFormat('FFF');
    created: number = DateTime.now().toMillis();
    timestamp: number = DateTime.now().toMillis();

    constructor(attendance?: any) {
        super(attendance);
        this.initialize(this, attendance);
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

    public process(): boolean {
        this.timestamp = DateTime.now().toMillis();

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
        this.log.push(`${DateTime.fromMillis(this.timestamp).toUTC().toFormat('ttt')} PROCESSED ${this.valid} ${Duration.fromMillis(this.credit).toFormat('hh:mm:ss')} credit`)
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

    local: string = DateTime.now().toFormat('ttt');
    timestamp: number = DateTime.now().toMillis();

    constructor(attendanceRecord?: any) {
        super(attendanceRecord);
        this.initialize(this, attendanceRecord);
    }
}