import * as _ from 'lodash';
import { FirePoint } from "geofirex";

import { Id } from "./id.class";
import { IUserBase } from './userBase.class';
import { IRideRequest, IUserBadge } from ".";

export interface IMeeting {
    gid: string;
    sid: string;
    badge: IUserBadge;
    point: FirePoint;
    start: string;
    end: string;
    secretary: string;
    speaker: string;
    collection: number;
    attendance: number;
    usersAttend: IUserBase[];
    birthdays: string[];
    firstTimers: string[];
    visitors: string[];
    topic: string;
    notes: string;
    rideRequests: IRideRequest[] | undefined
}

export interface IZoomMeeting extends IMeeting {
    zid: string;
    zUsersAttend: string[]; // Zoom users in attendance
}

export class Meeting extends Id implements IMeeting {
    gid: string                     = '';
    sid: string                     = '';
    badge: IUserBadge               = <any>null;
    point: FirePoint                = <any>null;
    start: string                   = '';
    end: string                     = '';
    secretary: string               = '';
    speaker: string                 = '';
    collection: number              = 0;
    attendance: number              = 0;
    usersAttend: IUserBase[]        = [];
    birthdays: string[]             = [];
    firstTimers: string[]           = [];
    visitors: string[]              = [];
    topic: string                   = '';
    notes: string                   = '';
    rideRequests: IRideRequest[]    = [];

    constructor(meeting?: IMeeting) {
        super(meeting);
        this.initialize(this, meeting);
    }
}