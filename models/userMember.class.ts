import * as _ from 'lodash';
import { DateTime } from 'luxon';
import { IUserActivity } from './userActivity.class';
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
        const lastActivity: DateTime = DateTime.fromISO(this.activity.lastTime).toLocal();
        return DateTime.local().diff(lastActivity).minutes < ONLINE_ACTIVITY;
    }

    public get daysSinceBday() {
        const bday:DateTime = DateTime.fromISO(this.bday);
        return DateTime.local().toUTC().diff(bday).days;
    }

    constructor(user?: any) {
        super(user)
        this.initialize(this, user);
        this.bday = user.profile.bday;
        this.activity = user.activity;
    }
}
