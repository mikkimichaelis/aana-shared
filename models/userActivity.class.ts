// import { FirePoint } from 'geofirex';
import { DateTime } from 'luxon';

import { IUserBase, UserBase } from './userBase.class';

export interface IUserActivity extends IUserBase {
    uid: string;

    url: string;

    lastAppRun: number;
    lastAppRun$: string;

    lastResume: number;
    lastResume$: string;

    timestamp: number;
    timestamp$: string;

    Aster_Michael: any;
    Arlen_Remi: any;
}

export class UserActivity extends UserBase implements IUserActivity {
    uid = '';
    url = '';

    lastAppRun = 0;
    lastAppRun$ = '';

    lastResume = 0;
    lastResume$ = '';

    timestamp = 0;
    timestamp$ = '';

    Aster_Michael = 'Go Away, Tickle Couch!';
    Arlen_Remi = 'Princess Love (✿ ♥‿♥)'

    constructor(data?: any) {
        super();
        this.initialize(this, data);
        this.uid = data.id;

        this.timestamp = DateTime.now().toMillis();
        this.timestamp$  = DateTime.now().toLocaleString(DateTime.DATETIME_SHORT);
    }
}
