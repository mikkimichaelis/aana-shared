import { FirePoint } from 'geofirex';
import * as _ from 'lodash';
import { Base } from './base.class';

import { UserBase } from './userBase.class';

export interface IUserActivity {
    lastLogon: string;
    lastTime: string;
    point: FirePoint;
}

export class UserActivity extends Base implements IUserActivity {
    lastLogon: string   = '';
    lastTime: string    = '';
    point: FirePoint    = <any>null;

    constructor(userActivity?: any) {
        super();
        this.initialize(this, userActivity);
    }
    
}
