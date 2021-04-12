// import { FirePoint } from 'geofirex';
import * as _ from 'lodash-es';

import { IUserBase, UserBase } from './userBase.class';

export interface IUserActivity extends IUserBase {
    lastLogon: string;
    lastTime: string;
    point: any; // FirePoint;
}

export class UserActivity extends UserBase implements IUserActivity {
    lastLogon: string   = '';
    lastTime: string    = '';
    point: any    = <any>null;

    constructor(userActivity?: any) {
        super();
        this.initialize(this, userActivity);
    }
}
