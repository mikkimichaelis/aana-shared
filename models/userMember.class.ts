import _ from 'lodash';
import { DateTime } from 'luxon';
import { IHomeGroup } from './group.interface';
import { IUserActivity } from './userActivity.class';
import { UserBase } from './userBase.class';

// Member of a homegroup
export interface IUserMember {
    aid: string;    // aid in UsersActivity collection
    bday: string;
    homeGroup: IHomeGroup;
    activity: IUserActivity;

    daysSinceBday: number;
    isOnline: boolean;
}

declare const ONLINE_ACTIVITY = 15;
export class UserMember extends UserBase implements IUserMember {
    aid!: string;        // Admin
    bday!: string;
    homeGroup!: IHomeGroup;
    activity!: IUserActivity;
    
    public get isOnline(): boolean {
        const lastActivity: DateTime = DateTime.fromISO(this.activity.lastTime).toLocal();
        return DateTime.local().diff(lastActivity).minutes < ONLINE_ACTIVITY;
    }

    public get daysSinceBday() {
        const bday:DateTime = DateTime.fromISO(this.bday);
        return DateTime.local().toUTC().diff(bday).days;
    }

    constructor(user?: any) {
        super(_.merge({
        }, user));
        this.bday = user.bday;
        this.homeGroup = user.homeGroup;
        this.activity = user.activity;
    }
}
