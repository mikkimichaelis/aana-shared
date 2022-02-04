import { head, isNil, last } from 'lodash';
import { DateTime, Duration } from 'luxon';
import { IUser } from '../models';
import { Id, IId } from '../models/id.class';
import { IMeeting } from './imeeting';
export interface IAttendance extends IId {
    zone?: string;
    uid: string;            // User.id
    mid: string;            // Meeting.id
    zid: string;            // Zoom meeting number (same as Meeting.zid)
    uzid: string;           // Unique Zoom Meeting id for this occurrence
    zpid: string;           // Zoom Participant id
    zuid: string;           // Zoom User ID

    user: IUser;            // [attached] Copies of user and meeting data at time of attendance
    meeting: IMeeting;      // [attached] Set server side when processed

    meetingStartTime$: string;
    meetingDuration$: string;

    records: IAttendanceRecord[];   // [attached]

    log: string[];          // verbose translation of attendanceRecords and accounting ledger for credit

    valid: boolean;

    timezone: string;       // tz of user at time of attendance

    start: number;          // utc millis when participation started
    start$: string;         // ISO string in timezone
    end: number;            // local utc millis when participation ended
    end$: string;           // ISO string in timezone

    duration: number;       // millis end - start
    duration$: string;

    credit: number;         // millis valid amount of duration credited for attendance (see log)
    credit$: string;        // hh:mm:ss

    processed: number;      // server utc millis processed or null
    processed$: string;     // ISO string in timezone

    updated: number;        // server utc millis last updated
    updated$: string;       // ISO string in UTC

    created: number;        // server utc millis created

    isValid(): boolean;
    update(): void;
    process(): Promise<boolean>; // returns success

    // addRecord(record: any): void;
}

export interface IAttendanceRecord extends IId {
    aid: string;
    status: string;     // [Zoom.MeetingStatus] || ['MEETING_ACTIVE_TRUE', 'MEETING_ACTIVE_FALSE']
    visible: boolean;   // Video Activity visible
    volume: number;     // device call volume (not media!)
    audio: boolean;     // Zoom audio connected
    loud: boolean;      // speakerphone

    local: string;      // local time string
    timestamp: number;  // UTC Millis from device

    userCount: number,
    password: string ,
    // inWaitingRoom: boolean,
    // unmuteSelfAllowed: boolean,
    isMyAudioMuted: boolean,
    canUnmuteMyVideo: boolean,
    isMyVideoMuted: boolean,
    // isSpotlight: boolean,
    getPinnedUser: number,
    activeVideoUserID: number
}

export class AttendanceRecord extends Id {
    status: string = <any>null;        // client populated
    visible: boolean = <any>null;    // client populated
    volume: number = <any>null;         // client populated
    audio: boolean = <any>null;      // client populated
    loud: boolean = <any>null;       // client populated
    userCount: number = 0;
    password: string = <any>null;
    // inWaitingRoom: boolean = <any>null;
    // unmuteSelfAllowed: boolean = <any>null;
    isMyAudioMuted: boolean = <any>null;
    canUnmuteMyVideo: boolean = <any>null;
    isMyVideoMuted: boolean = <any>null;
    // isSpotlight: boolean = <any>null;
    getPinnedUser: number = <any>null;
    activeVideoUserID: number = <any>null;

    local: string = DateTime.now().toFormat('ttt');
    timestamp: number = DateTime.now().toMillis();

    // @ts-ignore
    constructor(public aid: string, attendanceRecord: any) {
        super(attendanceRecord);
        this.initialize(this, attendanceRecord);
    }
}

export class Attendance extends Id implements IAttendance {
    uid: string = <any>null;
    mid: string = <any>null;
    zid: string = <any>null;
    uzid: string = <any>null;
    zpid: string = <any>null;
    zuid: string = <any>null;

    user: IUser = <any>null;
    meeting: IMeeting = <any>null;

    records: IAttendanceRecord[] = [];
    log: string[] = [];

    timezone: string = DateTime.now().zoneName;

    meetingStartTime$: string = <any>null;
    meetingDuration$: string = <any>null;
    
    start: number = DateTime.local().toMillis();                // client populated millis
    start$: string = DateTime.now().toUTC().toFormat('FFF');    // client populated local tz datetime string

    end: number = <any>null;                     // server populated millis
    end$: string = <any>null;                    // server populated local tz datetime string

    duration: number = <any>null;                // server populated millis
    duration$: string = <any>null;               // server populated string

    credit: number = <any>null;                  // server populated millis
    credit$: string = <any>null;                 // server populated hh:mm:ss string

    processed: number = <any>null;               // server populated millis
    processed$: string = <any>null;              // server populated local tz datetime string

    updated: number = <any>null;                 // server populated millis
    updated$: string = <any>null;                // server populated local tz datetime string

    created: number = <any>null;                 // server populated millis

    valid: boolean = false;                 // server populated

    constructor(attendance?: any, public zone?: string) {
        super(attendance);
        this.initialize(this, attendance);
        if (!this.zone) this.zone = DateTime.now().zoneName;
    }

    toObject(): IAttendance {
        // list properties that are static or computed or attached and
        // should not be serialized into the database with this document
        const exclude: string[] = ['user', 'meeting', 'records'];

        return super.toObject([...exclude, ...exclude.map(e => `_${e}`)]);
    }

    public update() {
        // TODO don't really like this much at all.....could move all this into setters to auto update the strings
        
        if (isNil(this.created)) this.created = DateTime.now().toMillis();

        if (!isNil(this.start)) this.start$ = DateTime.fromMillis(this.start).setZone(this.timezone).toFormat('FFF');
        if (!isNil(this.end)) this.end$ = DateTime.fromMillis(this.end).setZone(this.timezone).toFormat('FFF');
        if (!isNil(this.duration)) this.duration$ = Duration.fromMillis(this.duration).toFormat('hh:mm:ss');
        if (!isNil(this.credit)) this.credit$ = Duration.fromMillis(this.credit).toFormat('hh:mm:ss');
        if (!isNil(this.processed)) this.processed$ = DateTime.fromMillis(this.processed).toUTC().toFormat('FFF');

        this.updated = DateTime.now().toMillis();
        this.updated$ = DateTime.fromMillis(this.updated).setZone(this.timezone).toFormat('FFF');
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

    // Here we check for garbage
    // the garbage seems to be the time spent in the waiting room
    // 
    public isValid(): boolean {
        let valid = true;

        valid = valid && this.records.length > 2;   // require min three records to be valid
        // 1 START
        // 2 IN_MEETING STATUS
        // 3 END

        // @ts-ignore
        // const start = DateTime.fromMillis(head(this.records).timestamp);
        // @ts-ignore
        // const end = DateTime.fromMillis(last(this.records).timestamp);

        // TODO wtf wont this work?
        // const duration: Duration = end.diff(start); 
        // valid = valid && duration.minutes > 1;  // TODO config this
        // const duration = end.toMillis() - start.toMillis();
        // valid = valid && duration >= 60 * 1000;  // 1m - TODO config this

        return valid;
    }

    public async process(): Promise<boolean> {
        // @ts-ignore
        return new Promise<boolean>(async (resolve, reject) => {
            // try {
            this.updated = DateTime.now().toMillis();
            this.log = [];      // be sure to clear running lists.....
            this.credit = 0;    // and counters!
            this.duration = 0;

            this.records.sort((x,y) => {
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

                                if (index > 0) {
                                    const duration = Duration.fromMillis(r.timestamp - records[index - 1].timestamp);
                                    this.log.push(`${r.local} START ${duration.toFormat('hh:mm:ss')}s SKIPPED`);
                                } else {
                                    this.log.push(`${r.local} START`)
                                }
                            } else {
                                // this.log.push(`${r.local} UNKNOWN ${JSON.stringify(r)}`);
                            }
                        } else {
                            if (period_start) {
                                // end existing period
                                const duration = Duration.fromMillis(r.timestamp - period_start);
                                this.credit = this.credit + duration.toMillis();
                                this.log.push(`${r.local} END ${log} ${duration.toFormat('hh:mm:ss')}s CREDIT`);
                                period_start = null;
                            } else {
                                // this.log.push(`${r.local} UNKNOWN ${log}: ${JSON.stringify(r)}`);
                            }
                        }
                    }

                    this.end = r.timestamp;
                });
            }

            this.processed = DateTime.now().toMillis();
            this.update();
            this.log.push(`${DateTime.fromMillis(this.processed).setZone(this.timezone).toFormat('ttt')} PROCESSED ${this.valid ? 'VALID' : 'INVALID'} ${this.credit$}s CREDIT`)

            resolve(true);
        })
    }
}