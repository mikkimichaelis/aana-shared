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
    log: string[];          // invalid reasons otherwise []
    credit: number;         // millis of attendance

    timestamp: string;      // UTC ISO string

    isValid(): boolean;
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

    timestamp: string = '';

    constructor(attendance?: any) {
        super(attendance);
        this.initialize(this, attendance);
    }

    // Here we check for 
    // attendance time > 5m
    public isValid(): boolean {
        let valid = true;

        valid = valid && this.records.length > 1;   // require two records to be valid

        // @ts-ignore
        const start = DateTime.fromISO(head(this.records).timestamp);
        // @ts-ignore
        const end = DateTime.fromISO(last(this.records).timestamp);
        const duration: Duration = end.diff(start);

        valid = valid && duration.minutes > 5;

        return valid;
    }

    private validateRecords(): boolean {
        let valid = true;

        return valid;
    }
}

export interface IAttendanceRecord extends IId {
    status: string;
    visible: boolean;
    volume: number;
    audio: boolean;
    loud: boolean;
    timestamp: string;
}

export class AttendanceRecord extends Id {
    status: string = '';
    visible: boolean = false;
    volume: number = 0;
    audio: boolean = false;
    loud: boolean = false;
    timestamp: string = '';
   
    constructor(attendanceRecord?: any) {
        super(attendanceRecord);
        this.initialize(this, attendanceRecord);
    }
}