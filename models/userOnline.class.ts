import * as _ from 'lodash';
import { UserActivity } from './userActivity.class';

export interface IUserOnline {

    // IUserBase {
    // id: IUserBase;
    // name: string;    
    // }
    isOnline: boolean; // calculate this in a read trigger from UserActivity
    userActivity: {}; // populate with User's public Activity from UserActivity
}

export class UserOnline extends UserActivity {
    isOnline!: boolean;
    userActivity!: {};

    constructor(user?: any) {
        super(_.merge({
            isOnline: false,
            userActivity: {}
        }, user))
        // , (value: any, srcValue: any, key: string, object: any, source: any) => {
        //     switch (key) {
        //         case 'userActivity': {
        //             return new UserActivity(user);
        //         }
        //     }
        // }));
    }
}
