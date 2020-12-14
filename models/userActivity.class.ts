import { FirePoint } from 'geofirex';
import * as _ from 'lodash';

import { UserBase } from './userBase.class';

export interface IUserActivity {
    lastLogon: string;
    lastTime: string;
    point: FirePoint;
    activity: {};
}

export class UserActivity extends UserBase implements IUserActivity {
    lastLogon: string   = '';
    lastTime: string    = '';
    point!: FirePoint;
    activity: any       = '';

    constructor(userActivity?: any) {
        super(userActivity);
        this.initialize(this, userActivity);
    }
    
}
