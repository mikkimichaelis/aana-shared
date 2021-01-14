import * as _ from 'lodash';
import { FirePoint } from "geofirex";

import { Id, IId } from "./id.class";
import { IUserBase } from './userBase.class';
import { IRideRequest, IUserBadge } from ".";
import { IRecurrence } from '../listings';

export interface IMeeting extends IId {
    id: string;
    uid: string;
    isZoomOwner: boolean;
    name: string;
    password: string;
    topic: string;
    continuous: boolean;

    timezone: string;
    startTime: string;
    duration: number;

    recurrence: IRecurrence;
}

export interface IZoomMeeting extends IMeeting {
    zid: string;
    zUsersAttend: string[]; // Zoom users in attendance
}

export class Meeting extends Id implements IMeeting {
    uid: string                 = '';
    isZoomOwner: boolean        = false;
    name: string                = '';
    password: string            = '';
    topic: string               = '';
    continuous: boolean         = false;

    timezone: string            = "-5";
    startTime: string           = "00:00";
    duration: number            = 60;

    recurrence: IRecurrence     = null;

    constructor(meeting?: IMeeting) {
        super(meeting);
        this.initialize(this, meeting);
    }
}