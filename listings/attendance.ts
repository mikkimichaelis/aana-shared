import { head, isNil, last } from 'lodash';
import { DateTime, Duration } from 'luxon';
import { IUser } from '../models';
import { Id, IId } from '../models/id.class';
import { IMeeting } from './imeeting';
export interface IAttendanceRecord extends IId {
    aid: string;
    
    local: string;      // client populated
    timestamp: number;  // UTC Millis from device

    status: string;     // [Zoom.MeetingStatus] || ['MEETING_ACTIVE_TRUE', 'MEETING_ACTIVE_FALSE']
    visible: boolean;   // Video Activity visible
    volume: number;     // device call volume (not media!)
    audio: boolean;     // Zoom audio connected
    loud: boolean;      // speakerphone
    userCount: number,
    password: string,
    isMyAudioMuted: boolean,
    canUnmuteMyVideo: boolean,
    isMyVideoMuted: boolean,
    getPinnedUser: number,
    activeVideoUserID: number
}

export class AttendanceRecord extends Id implements IAttendanceRecord {
    aid: string = <any>null;

    local: string = DateTime.now().toFormat('ttt');
    timestamp: number = DateTime.now().toMillis();

    // Zoom data
    status: string = <any>null;
    visible: boolean = <any>null;
    volume: number = <any>null;
    audio: boolean = <any>null;
    loud: boolean = <any>null;
    userCount: number = 0;
    password: string = <any>null;
    isMyAudioMuted: boolean = <any>null;
    canUnmuteMyVideo: boolean = <any>null;
    isMyVideoMuted: boolean = <any>null;
    getPinnedUser: number = <any>null;
    activeVideoUserID: number = <any>null;

    // TODO bug here...same as below
    // @ts-ignore
    constructor(record: any) {
        super(record);
        this.initialize(this, record);
    }
}

export enum AttendanceStatus {
    unknown,        
    active,         // meeting is active
    pending,        // meeting is pending upload
    uploading,      // meeting is being uploaded
    uploaded,       // meeting is uploaded
    processing,     // meeting is being processed
    processed       // meeting is processed
}
export interface IAttendance extends IId {
    uid: string;            // User.id
    mid: string;            // Meeting.id
    zid: string;            // Zoom meeting number (same as Meeting.zid)
    uzid: string;           // Unique Zoom Meeting id for this occurrence
    zpid: string;           // Zoom Participant id
    zuid: string;           // Zoom User ID

    timezone: string;       // tz of user at time of attendance
    timestamp: number;

    status: AttendanceStatus;
    valid: boolean;
    log: string[];          // verbose translation of attendanceRecords and accounting ledger for credit

    meetingStartTime$: string;
    meetingDuration$: string;

    start: number; start$: string;              // utc millis when participation started
    end: number; end$: string;                  // local utc millis when participation ended
    duration: number; duration$: string;        // millis end - start
    credit: number; credit$: string;            // millis valid amount of duration credited for attendance (see log)
    processed: number; processed$: string;      // server utc millis processed or null
    updated: number; updated$: string;          // server utc millis last updated

    user: IUser;            // [attached] Copies of user and meeting data at time of attendance
    meeting: IMeeting;      // [attached] Set server side when processed
    records: IAttendanceRecord[];   // [attached]


    isValid(): boolean;
    update(): void;
    process(): Promise<boolean>;
}
export class Attendance extends Id implements IAttendance {
    uid: string = <any>null;
    mid: string = <any>null;
    zid: string = <any>null;
    uzid: string = <any>null;
    zpid: string = <any>null;
    zuid: string = <any>null;

    timezone: string = DateTime.now().zoneName;
    timestamp: number = DateTime.now().toMillis();

    status: AttendanceStatus = AttendanceStatus.unknown;
    valid: boolean = false;
    log: string[] = [];

    meetingStartTime$: string = <any>null;  // time meeting started
    meetingDuration$: string = <any>null;

    start: number = DateTime.now().toMillis(); start$: string = <any>null;  // server populated millis
    end: number = <any>null; end$: string = <any>null;                      // server populated millis
    duration: number = <any>null; duration$: string = <any>null;            // server populated millis
    credit: number = <any>null; credit$: string = <any>null;                // server populated millis
    processed: number = <any>null; processed$: string = <any>null;          // server populated millis
    updated: number = <any>null; updated$: string = <any>null;              // server populated millis

    // EXCLUDED!
    user: IUser = <any>null;
    meeting: IMeeting = <any>null;
    records: IAttendanceRecord[] = [];

    // server side called constructor only!
    constructor(attendance: any) {
        super(attendance);
        // don't used passed in status here (only used in AttendanceRecord)
        // TODO this is a security hole.  Any authorized user can post any default values here.  Meaning passing attendance.end = 99999999999999999
        this.initialize(this, attendance);
    }

    toObject(): IAttendance {
        // list properties that are static or computed or attached and
        // should not be serialized into the database with this document
        const exclude: string[] = ['user', 'meeting', 'records'];
        return super.toObject([...exclude, ...exclude.map(e => `_${e}`)]);
    }

    // TODO don't really like this much at all.....could move all this into setters to auto update the strings
    public update() {
        if (!isNil(this.start)) this.start$ = DateTime.fromMillis(this.start).setZone(<any>this.timezone).toFormat('FFF');
        if (!isNil(this.end)) this.end$ = DateTime.fromMillis(this.end).setZone(<any>this.timezone).toFormat('FFF');
        if (!isNil(this.duration)) this.duration$ = Duration.fromMillis(this.duration).toFormat('hh:mm:ss');
        if (!isNil(this.credit)) this.credit$ = Duration.fromMillis(this.credit).toFormat('hh:mm:ss');
        if (!isNil(this.processed)) this.processed$ = DateTime.fromMillis(this.processed).toUTC().toFormat('FFF');

        this.updated = DateTime.now().toMillis();
        this.updated$ = DateTime.fromMillis(this.updated).setZone(<any>this.timezone).toFormat('FFF');
    }

    // TODO validate based on length of attendance
    public isValid(): boolean {
        let valid = true;

        valid = this.records.length > 2;   // require min three records to be valid
        if (!valid) return valid;

        valid = head(this.records)?.status === 'MEETING_ACTIVE_TRUE';
        if (!valid) return valid;

        valid = last(this.records)?.status === 'MEETING_ACTIVE_FALSE';
        return valid;
    }

    // TODO ADD MASSIVE ERROR CHECKING!!!
    public async process(): Promise<boolean> {
        // @ts-ignore
        return new Promise<boolean>(async (resolve, reject) => {
            // try {
            this.updated = DateTime.now().toMillis();
            this.log = [];      // be sure to clear running lists.....
            this.credit = <any>null;    // and counters!
            this.duration = <any>null;

            this.records = this.records.sort((x, y) => {
                if (x.timestamp < y.timestamp) return -1;
                if (x.timestamp > y.timestamp) return 1;
                return 0;
            });

            this.valid = this.isValid();
            if (!this.valid) {
                // @ts-ignore
                this.end = last(this.records).timestamp;
            } else {
                // @ts-ignore
                // we know records.length > 2
                this.duration = last(this.records).timestamp - head(this.records).timestamp;

                // here we create a log entry for each period (intended for support viewing)
                // a period is the time between validity changes
                let period_start: any = null;

                this.records.forEach((r, index, records) => {
                    let log = ``;
                    if (r.status === 'MEETING_ACTIVE_TRUE') {
                        period_start = r.timestamp;

                        if (index > 0) {
                            const duration = Duration.fromMillis(r.timestamp - records[index - 1].timestamp);
                            this.log.push(`${r.local} START ${duration.toFormat('hh:mm:ss')}s SKIPPED`);
                        } else {
                            this.log.push(`${r.local} START`)
                        }
                    } else if (r.status === 'MEETING_ACTIVE_FALSE') {
                        if (period_start) {
                            const duration = Duration.fromMillis(r.timestamp - period_start);
                            this.credit = this.credit + duration.toMillis();
                            this.log.push(`${r.local} END ${duration.toFormat('hh:mm:ss')}s CREDIT`);
                        } else {
                            // invalid
                        }
                        period_start = null;
                    } else if (r.status === 'MEETING_STATUS_INMEETING') {
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
                                period_start = r.timestamp; // start a period

                                if (index > 0) {
                                    const duration = Duration.fromMillis(r.timestamp - records[index - 1].timestamp);
                                    this.log.push(`${r.local} START ${duration.toFormat('hh:mm:ss')}s SKIPPED`);
                                } else {
                                    this.log.push(`${r.local} START`)
                                }
                            } else {
                                // skip this MEETING_STATUS_INMEETING .. we are already in a period
                            }
                        } else {
                            if (period_start) {
                                // end existing period
                                const duration = Duration.fromMillis(r.timestamp - period_start);
                                this.credit = this.credit + duration.toMillis();
                                this.log.push(`${r.local} END ${log} ${duration.toFormat('hh:mm:ss')}s CREDIT`);
                                period_start = null;
                            } else {
                                // skip this MEETING_STATUS_INMEETING .. this record is not valid & we're not in a period anyway
                            }
                        }
                    } else {
                        throw new Error(`UNKNOWN STATUS: ${r.status}`);
                    }

                    this.end = r.timestamp;
                });

                this.processed = DateTime.now().toMillis();
                this.update();
                this.log.push(`${DateTime.fromMillis(this.processed).setZone(<any>this.timezone).toFormat('ttt')} PROCESSED ${this.valid ? 'VALID' : 'INVALID'} ${this.credit$}s CREDIT`)

                resolve(true);
            }
        })
    }

    // public addRecord(record: any) {
    //     if (['MEETING_ACTIVE_FALSE', 'MEETING_ACTIVE_TRUE]'].indexOf(record.status) == -1) {
    //         // update with zoom meeting values
    //         // these are not available for MEETING_ACTIVE_TRUE || MEETING_ACTIVE_FALSE events.
    //         // We must wait a few seconds after MEETING_ACTIVE_TRUE to receive
    //         // this data in the first ZoomVisibleTask event providing visibility status, etc.
    //         this.zid = record.zid;
    //         this.zpid = record.zpid;
    //         this.uzid = record.uzid;
    //         this.zuid = record.zuid;
    //     }
    //     this.records.push(new AttendanceRecord(record));
    // }
}