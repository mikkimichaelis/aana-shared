// import { FirePoint } from 'geofirex';
import { DateTime } from 'luxon';

import { IUserBase, UserBase } from './userBase.class';

export interface IUserActivity extends IUserBase {
    id: string,
    name: string,
    avatar: string,
    lastLogon: string;
    lastTime: string;
    point: any; // FirePoint;
}

export class UserActivity extends UserBase implements IUserActivity {
    id: string          = '';
    name: string        = '';
    avatar: string      = '';
    lastLogon: string   = '';
    lastTime: string    = DateTime.utc().toISO();
    point: any          = <any>null;

    constructor(activity?: any) {
        super();
        this.initialize(this, activity);
    }
}
