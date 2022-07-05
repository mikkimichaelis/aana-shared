// import { FirePoint } from 'geofirex';
import { DateTime } from 'luxon';
import { IUserBase, UserBase } from './userBase.class';

export interface IUserActivity extends IUserBase {
    uid: string;

    url: string;

    version: string;

    app_run_last: number;
    app_run_last$: string;

    resume_last: number;
    resume_last$: string;

    timestamp: number;
    timestamp$: string;

    Aster_Michael: any;
    Arlen_Remi: any;
}

export class UserActivity extends UserBase implements IUserActivity {
    uid = '';
    url = '';

    version = '';

    app_run_last = 0;
    app_run_last$ = '';

    resume_last = 0;
    resume_last$ = '';

    timestamp = 0;
    timestamp$ = '';

    Aster_Michael = 'I Love You x 6!';
    Arlen_Remi = 'Princess Love (✿ ♥‿♥)';

    constructor(data?: any) {
        super();
        this.initialize(this, data);
        this.uid = data.id;

        this.timestamp = DateTime.now().toMillis();
        this.timestamp$  = DateTime.now().toLocaleString(DateTime.DATETIME_SHORT);
    }
}
