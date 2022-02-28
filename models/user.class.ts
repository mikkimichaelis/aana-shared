import { findIndex, has, isEmpty, merge, remove } from 'lodash';
import { DateTime, Duration } from 'luxon';
import { IUserBase, UserBase } from './userBase.class';
import { Base } from './base.class';
import { IUserMember, UserMember } from './userMember.class';
import { IUserFavorite } from './userFavorite.class';
import { IUserFriend } from './userFriend.class';
import { IUserActivity, UserActivity } from './userActivity.class';
import { HomeGroup, IGroup, IHomeGroup } from './group.class';
import { IMeeting } from '../listings/imeeting';
import { Id } from './id.class';
import { IUserRating } from './user-rating';

export interface IUserProfile {
    anonymous: boolean;
    name: string;
    firstName: string;
    lastInitial: string;
    bday: string;
    pronouns: string;
    location: string;
}
export interface IUserPreferences {
    apptag: boolean;
    homemeeting: boolean;
    pronouns: boolean;
    pronouns_value: string;
    sobriety: boolean;
    sobriety_value: string;
    sobriety_days: boolean;
    location: boolean;
    location_value: string;
}

export class UserProfile extends Base implements IUserProfile {
    anonymous: boolean = true;
    name: string = 'Anonymous A';
    firstName: string = 'Anonymous';
    lastInitial: string = 'A';
    bday: string = '';
    pronouns: string = '';
    location: string = '';

    // ignore provided values that don't exist on object
    // overwrite defaults with provided values

    constructor(profile?: any) {
        super();

        this.initialize(this, profile)
    }
}

export interface IUserStats {
    uid: string;                        // user id
    
    run_duration: number;               // total app use ms
    run_duration$: string;              // time string display of duration
    created: number;                    // created ts
    created$: string;                   // created date time string
    timestamp: number;                  // last update ts

    rating_prompts: number;
    rating_enjoys: number;
    rating_ratings: number;
    rating_reminds: number;
    rating_feedback: number;
    rating_feedback_decline: number;

    app_run_last: number;
    app_runs_total: number;             // updated every time the app starts +1
    app_runs_today: number;             // updated ever app start, reset to 0 by nightly process to use in calculating running averages
    app_runs_data: number[];            // array of previous app_runs_today values

    app_runs_avg_7: number;
    app_runs_avg_14: number;
    app_runs_avg_28: number;
    app_runs_avg_2m: number;
    app_runs_avg_4m: number;
    app_runs_avg_6m: number;

    meeting_timestamp_last: number;
    meeting_date_last: string;          // updated by joinMeeting()
    meeting_count_total: number;        // updated by joinMeetings()
    meeting_count_today: number;        // updated by joinMeetings(), reset to 0 by nightly process to use in calculating running averages
    meeting_count_data: number[];       // array of previous meeting_count_today values
    
    meeting_count_avg_7: number;        // 7 day running average meetings per day
    meeting_count_avg_14: number;       // 14 day
    meeting_count_avg_28: number;       // 27 day
    meeting_count_avg_2m: number;       // 2 month
    meeting_count_avg_4m: number;       // 4 month
    meeting_count_avg_6m: number;       // 6 month running average meetings per day

    appRun(): void;
    appRatingPrompt(rating: IUserRating): void;
    meetingCount(meeting: IMeeting): void;
}

export class UserStats extends Id implements IUserStats {
    uid = '';
    
    run_duration = 0;
    run_duration$ = '';
    created = DateTime.now().toMillis();
    created$ = DateTime.now().toLocaleString(DateTime.DATETIME_SHORT);
    timestamp = DateTime.now().toMillis();  // last update ts

    rating_prompts = 0;
    rating_enjoys = 0;
    rating_ratings = 0;
    rating_reminds = 0;
    rating_feedback = 0;
    rating_feedback_decline = 0;
    
    app_run_last = 0;
    app_runs_total = 0;
    app_runs_today = 0;
    app_runs_data: number[] = [];

    app_runs_avg_7 = 0;
    app_runs_avg_14 = 0;
    app_runs_avg_28 = 0;
    app_runs_avg_2m = 0;
    app_runs_avg_4m = 0
    app_runs_avg_6m = 0;

    meeting_timestamp_last = <any>null;
    meeting_date_last = <any>null;
    meeting_count_total = 0;
    meeting_count_today = 0;
    meeting_count_data: number[] = [];

    meeting_count_avg_7 = 0;
    meeting_count_avg_14 = 0;
    meeting_count_avg_28 = 0;
    meeting_count_avg_2m = 0;
    meeting_count_avg_4m = 0;
    meeting_count_avg_6m = 0;

    constructor(userStats?: any) {
        super(userStats);
        this.initialize(this, userStats);
    }

    appRun() {
        this.timestamp = DateTime.now().toMillis();
        this.app_run_last  = DateTime.now().toMillis();
        this.app_runs_total += 1;
        this.app_runs_today += 1;
    }

    duration(ms: number) {
        this.run_duration += ms;
        this.run_duration$ = Duration.fromMillis(this.run_duration).toFormat('yy:dd:hh:mm:ss');
    }

    appRatingPrompt(rating: IUserRating) {
        this.timestamp = DateTime.now().toMillis();
        this.rating_prompts += 1;
        if (rating.rate) this.rating_ratings += 1;
        if (rating.enjoy) this.rating_enjoys += 1;
        if (rating.remind) this.rating_reminds += 1;
        if (rating.feedback) this.rating_feedback += 1;
        if (rating.feedback_declined) this.rating_feedback_decline += 1;
    }

    meetingCount(meeting: IMeeting) {
        this.timestamp = DateTime.now().toMillis();
        this.meeting_timestamp_last = DateTime.now().toMillis();
        this.meeting_date_last = DateTime.now().toLocaleString(DateTime.DATETIME_SHORT);
        this.meeting_count_total += 1;
        this.meeting_count_today += 1;
    }
}

export interface IUser extends IUserBase {
    preferences: IUserPreferences,
    email: string;
    emailVerified: boolean;
    zoomUser: boolean;
    profile: IUserProfile;
    activity: IUserActivity;
    member: IUserMember;
    homeMeeting: string;
    homeGroup: IHomeGroup;
    favGroups: IUserFavorite[];
    favMeetings: string[];
    blkMeetings: string[];
    friends: IUserFriend[];
    attendance: string[];

    chatUser: any;
    created: string;

    addFavoriteMeeting(mid: string): boolean;
    removeFavoriteMeeting(mid: string): boolean;

    setUserAuthNames(displayName?: string): boolean;
    setUserNames(firstName: string, lastInitial: string): boolean;
}

declare const ONLINE_ACTIVITY = 15;
export class User extends UserBase implements IUser {
    preferences: IUserPreferences = {
        apptag: true,
        homemeeting: false,
        pronouns: false,
        pronouns_value: '',
        sobriety: false,
        sobriety_value: '',
        sobriety_days: false,
        location: false,
        location_value: '',
    }
    email: string = '';
    emailVerified: boolean = false;
    zoomUser: boolean = false;
    profile: IUserProfile = <any>null;
    activity: IUserActivity = <any>null;
    member: IUserMember = <any>null;    // TODO ???
    homeMeeting: string = <any>null;
    homeGroup: IHomeGroup = <any>null;
    favGroups: IUserFavorite[] = [];
    favMeetings: any[] = [];
    blkMeetings: any[] = [];
    friends: IUserFriend[] = [];
    chatUser: any = null;
    created: string = DateTime.utc().toISO();
    attendance: string[] = [];

    // public get isOnline(): boolean {
    //     const lastActivity: DateTime = DateTime.fromISO(this.activity.lastTime);
    //     return DateTime.utc().diff(lastActivity).minutes < ONLINE_ACTIVITY;
    // }

    public get daysSinceBday() {
        const bday: DateTime = DateTime.fromISO(this.profile.bday);
        return DateTime.utc().diff(bday).days;
    }

    constructor(user?: any) {
        super(user);    // pass to super user?

        // This is the BaseClass (root) initialize()
        // parm1: subclass instance (this)
        // parm2: constructor parameters
        this.initialize(this, user);

        // Create Custom Object Properties
        if (has(user, 'profile') && !isEmpty(user.profile)) {
            this.profile = new UserProfile(user.profile);
        } else {
            this.profile = new UserProfile(
                merge(user, {
                    anonymous: false,
                    avatar: this.avatar
                }));

            this.setUserAuthNames(user.name);
        }
        if (has(user, 'activity') && !isEmpty(user.activity)) {
            this.activity = new UserActivity(user.activity);
        } else {
            user.activity = new UserActivity({
                id: this.id,
                name: this.profile.name,
                avatar: this.avatar,
                lastLogon: DateTime.utc().toISO(),
                lastTime: DateTime.utc().toISO(),
                point: null,
            });
        }
        if (has(user, 'member') && !isEmpty(user.member)) this.member = new UserMember(user.member);
        if (has(user, 'homeGroup') && !isEmpty(user.homeGroup)) this.homeGroup = new HomeGroup(user.homeGroup);
    }

    toObject(): IUser {
        return super.toObject(['isOnline', 'daysSinceBday'])
    }

    toGeoObject(geo?: any): IUser {
        const activity = this.activity;
        const obj = super.toGeoObject(geo);
        obj.activity = activity.toGeoObject(geo);
        return obj;
    }

    public get isHomeMeeting(): boolean {
        return this.id === this.homeMeeting;
    }

    public isFavoriteMeeting(mid: string): boolean {
        return -1 !== findIndex(this.favMeetings, (id => {
            return (id === mid);
        }))
    }

    public addFavoriteMeeting(mid: string): boolean {
        if (!this.isFavoriteMeeting(mid)) {
            this.favMeetings.push(mid);
            return this.isFavoriteMeeting(mid);
        } else {
            return false;
        }
    }

    public removeFavoriteMeeting(mid: string): boolean {
        if (this.isFavoriteMeeting(mid)) {
            const removed = remove(this.favMeetings, (value: any, index: number, array: any) => {
                return value === mid;
            });
            return !this.isFavoriteMeeting(mid);
        } else {
            return false;
        }
    }

    public setUserAuthNames(name?: string): boolean {
        const random_li = ''; // 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
        const names = <string[]>name?.split(' ');
        this.profile.firstName = names[0];
        this.profile.lastInitial = (names.length === 1) ? random_li
            : (names[1].length > 0) ? names[1].substr(0, 1).toUpperCase() : random_li;
        return this.setUserNames(this.profile.firstName, this.profile.lastInitial);
    }

    public setUserNames(firstName: string, lastInitial: string): boolean {
        if (!firstName
            || firstName.length > 25
            || lastInitial.length > 25) {
            return false;
        }
        this.profile.firstName = firstName;
        this.profile.lastInitial = lastInitial ? lastInitial : '';
        this.profile.name = `${this.profile.firstName} ${this.profile.lastInitial}` + (this.profile.lastInitial.length === 1 ? '.' : '');
        this.name = this.profile.name;
        return true;
    }

    public setHomeGroup(group: IGroup) {
        this.homeGroup = new HomeGroup(group);
    }

    public removeHomeGroup() {
        this.homeGroup = <any>null;
    }
}

