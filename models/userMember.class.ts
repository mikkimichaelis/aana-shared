import * as _ from 'lodash';
import { DateTime } from 'luxon';
import { IUserActivity, UserActivity } from './userActivity.class';
import { UserBase } from './userBase.class';

// Member of a homegroup
export interface IUserMember extends UserBase {
    bday: string;
    activity: IUserActivity;
}

declare const ONLINE_ACTIVITY = 15;
export class UserMember extends UserBase implements IUserMember {
    bday:string                 = '';
    activity: IUserActivity     = <any>null;
    
    public get isOnline(): boolean {
        const lastActivity: DateTime = DateTime.fromISO(this.activity.lastTime);
        const diff = DateTime.utc().diff(lastActivity);
        const online =  (diff.milliseconds / 1000 / 60) < 15;
        return online;
    }

    public get daysSinceBday() {
        const bday:DateTime = DateTime.fromISO(this.bday);
        const days = DateTime.utc().diff(bday).days;
        if( _.isNaN(days) ) {
            return 0;
        } else {
            return days;
        }
    }

    constructor(member?: any) {
        super(member)
        this.initialize(this, member);

        // Overwrite custom member paths if passed IUser
        this.bday = _.get(member, 'profile.bday', this.bday);   // TODO bday is null?
        this.activity = _.get(member, 'activity', this.activity);

        if(!_.isEmpty(this.activity)) this.activity = new UserActivity(this.activity);
    }
}
