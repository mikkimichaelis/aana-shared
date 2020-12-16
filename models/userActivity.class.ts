import { FirePoint } from 'geofirex';
import * as _ from 'lodash';

import { IUserBase, UserBase } from './userBase.class';

export interface IUserActivity extends IUserBase {
    lastLogon: string;
    lastTime: string;
    point: FirePoint;
}

export class UserActivity extends UserBase implements IUserActivity {
    lastLogon: string   = '';
    lastTime: string    = '';
    point: FirePoint    = <any>null;

    constructor(userActivity?: any) {
        super();
        this.initialize(this, userActivity);
    }
}
