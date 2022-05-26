import { head, last } from 'lodash';
import { DateTime, Duration } from 'luxon';
import { v4 as uuidv4 } from 'uuid';
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

    local: string = <any>null;
    timestamp: number = <any>null;

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
        this.local = DateTime.fromMillis(this.timestamp).toFormat('ttt');
    }
}

export enum AttendanceStatus {
    invalid = 'invalid',        // failed processing
    unknown = 'unknown',
    active = 'active',         // meeting is active
    pending = 'pending',        // attendance is pending upload
    uploading = 'uploading',      // attendance is uploading
    uploaded = 'uploaded',       // attendance is uploaded
    processing = 'processing',     // attendance is processing
    processed = 'processed'       // attendance is processed
}
export interface IAttendance extends IId {
    uid: string;            // User.id
    mid: string;            // Meeting.id
    zid: string;            // Zoom meeting number (same as Meeting.zid)
    uzid: string;           // Unique Zoom Meeting id for this occurrence
    zpid: string;           // Zoom Participant id
    zuid: string;           // Zoom User ID

    _timezone: string;       // tz of user at time of attendance
    timestamp: number;

    ___status: AttendanceStatus;
    ___valid: boolean;
    log: string[];          // verbose translation of attendanceRecords and accounting ledger for credit

    _meetingStartTime$: string;
    _meetingDuration$: string;
    _meetingName$: string;

    start: number; __start$: string;              // utc millis when participation started
    end: number; __end$: string;                  // local utc millis when participation ended
    duration: number; __duration$: string;        // millis end - start
    credit: number; __credit$: string;            // millis ___valid amount of duration credited for attendance (see log)
    processed: number; _processed$: string;      // server utc millis processed or null
    updated: number; _updated$: string;          // server utc millis last updated

    user: IUser;            // [attached] Copies of user and meeting data at time of attendance
    meeting: IMeeting;      // [attached] Set server side when processed
    records: IAttendanceRecord[];   // [attached]

    version: number;                            // attendance algorithm version

    isValid(): Promise<boolean>;
    repair(): Promise<IAttendance>
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

    _timezone: string = DateTime.now().zoneName;
    timestamp: number = DateTime.now().toMillis();

    ___status: AttendanceStatus = AttendanceStatus.unknown;
    ___valid: boolean = false;
    log: string[] = [];

    _meetingStartTime$: string = <any>undefined; 
    _meetingDuration$: string = <any>undefined;
    _meetingName$: string = <any>undefined;

    start: number = DateTime.now().toMillis(); __start$: string = <any>null;  // server populated millis
    end: number = 0; __end$: string = <any>null;                              // server populated millis
    duration: number = 0; __duration$: string = <any>null;                    // server populated millis
    credit: number = 0; __credit$: string = <any>null;                        // server populated millis

    processed: number = <any>null; _processed$: string = <any>null;          // server populated millis
    updated: number = <any>null; _updated$: string = <any>null;              // server populated millis

    // EXCLUDED!
    user: IUser = <any>null;
    meeting: IMeeting = <any>null;
    records: IAttendanceRecord[] = [];

    version: number = 1;

    // server side called constructor only!
    constructor(attendance: any) {
        super(attendance);
        // TODO this is a security hole.  Any authorized user can post any default values here.  Meaning passing attendance.end = 99999999999999999
        this.initialize(this, attendance);
    }

    toObject(): IAttendance {
        // list properties that are static or computed or attached and
        // should not be serialized into the database with this document
        const exclude: string[] = ['user', 'meeting', 'records', 'reentry'];
        return super.toObject([...exclude, ...exclude.map(e => `_${e}`)]);
    }

    public update() {
        this.__start$ = DateTime.fromMillis(this.start).setZone(<any>this._timezone).toFormat('FFF');
        this.__end$ = DateTime.fromMillis(this.end).setZone(<any>this._timezone).toFormat('FFF');
        this.__duration$ = Duration.fromMillis(this.duration).toFormat('hh:mm:ss');
        this.__credit$ = Duration.fromMillis(this.credit).toFormat('hh:mm:ss');

        if (this.processed > 0) this._processed$ = DateTime.fromMillis(this.processed).toUTC().toFormat('FFF');

        this.updated = DateTime.now().toMillis();
        this._updated$ = DateTime.fromMillis(this.updated).setZone(<any>this._timezone).toFormat('FFF');
    }

    /*
        returns true if ___valid
        otherwise throws invalid reason
    */
    public async isValid(): Promise<boolean> {
        // order records by timestamp
        this.sort();

        // repair() depends on this specific ordering to diagnosis.
        // specifically 'invalid records length' must be throw last (let other possibly fixable errors be thrown first :-))
        // TODO may be old comments above, update to find vs head/last
        if (-1 === this.records.findIndex(record => record.status === 'MEETING_ACTIVE_TRUE')) throw new Error('invalid MEETING_ACTIVE_TRUE');
        if (-1 === this.records.findIndex(record => record.status === 'MEETING_STATUS_INMEETING')) throw new Error('invalid MEETING_STATUS_INMEETING');
        if (-1 === this.records.findIndex(record => record.status === 'MEETING_ACTIVE_FALSE')) throw new Error('invalid MEETING_ACTIVE_FALSE');
        if (this.records.length < 3) debugger; // throw new Error('invalid records length');
        return true;
    }

    /*
        if isValid return this
        if ! attempt to repair issue
            if repaired throw this (doing this allows caller to differentiate between a ___valid this return or a repaired this throw)
            if ! rethrow original isValid error (so caller knows the failure reason (and can log it properly))
    */
    private reentry = false;
    public async repair(): Promise<IAttendance> {
        await this.isValid().catch(async error => { // throws diagnostic error message 
            switch (error.message) {
                case 'invalid MEETING_ACTIVE_TRUE':
                    // 
                    throw error;
                    break;
                case 'invalid MEETING_STATUS_INMEETING':
                    throw error;
                    break;
                case 'invalid MEETING_ACTIVE_FALSE':                // this is what repairs a power loss while in meeting   
                    let _last = last(this.records);                 // get last record to use as template for missing MEETING_ACTIVE_FALSE
                    let repair: any =  { ...last, ...{ ___status: 'MEETING_ACTIVE_FALSE', id: uuidv4() } };
                    repair = new AttendanceRecord(repair)
                    this.records.push(repair);                       // replace missing record
                    let repaired = null;
                    if (repaired = this.isValid().catch(error => { throw error; })) throw repaired;
                    break;
                // wip...
                // // call self to verify we are repaired (isValid only throws the *first* error found, there may be more ;-())
                // if (!this.reentry) {
                //     this.reentry = true;                            // going to reenter
                //     try {
                //         // if this returned unmodified (since repair), throw (this) back to caller to signify return of repaired this
                //         if (this === await this.repair().catch(() => null)) throw (this);   
                //         this.reentry = false;                       // reset reentry to allow to repair be called again
                //         throw error;                                // tell caller repair failed
                //     } catch {
                //         this.reentry = false;
                //         throw error;                               // tell caller repair failed
                //     }
                // } else {
                //     // we went in a loop..., tell caller repair failed
                //     this.reentry = false;
                //     throw error;
                // }

                case 'invalid record length':
                    throw error;

                default:
                    debugger;
                    throw error;
            }
        });
        return this;
    }

    // TODO ADD MASSIVE ERROR CHECKING!!!
    public async process(): Promise<boolean> {
        return new Promise<boolean>(async (resolve, reject) => {
            try {   // massive error checking.....shh.....
                this.updated = DateTime.now().toMillis();
                this.log = [];                  // be sure to clear running lists.....
                this.credit = <any>null;        // and counters!
                this.___valid = await this.isValid().catch(() => false);
                if (!this.___valid) {
                    // @ts-ignore
                    this.end = last(this.records)?.timestamp;
                    this.duration = this.end - this.start;
                    this.credit = 0;
                    this.___valid  = false;
                    this.___status = AttendanceStatus.invalid;
                } else {
                    this.duration = (<any>last(this.records)).timestamp - (<any>head(this.records)).timestamp;

                    // here we create a log entry for each period (human readable)
                    // a period is the time between validity changes
                    let period_start: any = null;
                    // this.sort()                                     // in isValid() above
                    this.records.forEach((r, index, records) => {
                        let log = ``;
                        if (r.status === 'MEETING_ACTIVE_TRUE') {   // signals start of meeting
                            period_start = r.timestamp;             // start a period
                            this.log.push(`${r.local} START`)
                        } else if (r.status === 'MEETING_ACTIVE_FALSE') {
                            if (period_start) {
                                const duration = Duration.fromMillis(r.timestamp - period_start);
                                this.credit += duration.toMillis();
                                this.log.push(`${r.local} END ${duration.toFormat('hh:mm:ss')}s CREDIT`);
                            } else {
                                // invalid Attendance
                            }
                            period_start = null;
                        } else if (r.status === 'MEETING_STATUS_INMEETING') {
                            // if (!r.visible) {
                            //     log = log + '!VISIBLE ';
                            // }

                            // if (!r.audio) {
                            //     log = log + '!AUDIO ';
                            // }

                            // if (r.volume < .4) {    // TODO WTF?
                            //     log = log + '!VOLUME ';
                            // }

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
                                    // skip this MEETING_STATUS_INMEETING .. this record is not ___valid & we're not in a period anyway
                                }
                            }
                        } else {
                            throw new Error(`UNKNOWN STATUS: ${r.status}`);
                        }

                        this.end = r.timestamp;
                    });
                }

                this.processed = DateTime.now().toMillis();
                this.update();
                this.log.push(`${DateTime.fromMillis(this.processed).setZone(<any>this._timezone).toFormat('ttt')} PROCESSED ${this.___valid ? 'VALID' : 'INVALID'} ${this.__credit$}s CREDIT`)

                resolve(true);
            } catch (error) {
                resolve(false);
            }
        })
    }

    public sort() {
        this.records = this.records.sort((x, y) => {
            if (x.timestamp < y.timestamp) return -1;
            if (x.timestamp > y.timestamp) return 1;
            return 0;
        });
    }

    // public addRecord(record: any) {
    //     if (['MEETING_ACTIVE_FALSE', 'MEETING_ACTIVE_TRUE]'].indexOf(record.___status) == -1) {
    //         // update with zoom meeting values
    //         // these are not available for MEETING_ACTIVE_TRUE || MEETING_ACTIVE_FALSE events.
    //         // We must wait a few seconds after MEETING_ACTIVE_TRUE to receive
    //         // this data in the first ZoomVisibleTask event providing visibility ___status, etc.
    //         this.zid = record.zid;
    //         this.zpid = record.zpid;
    //         this.uzid = record.uzid;
    //         this.zuid = record.zuid;
    //     }
    //     this.records.push(new AttendanceRecord(record));
    // }
}