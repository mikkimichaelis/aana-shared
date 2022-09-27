import { findIndex, has, isEmpty, merge, remove } from 'lodash';
import { DateTime, Duration } from 'luxon';
import { max, mean } from 'mathjs';
import { basename } from 'path';
import { IMeeting } from '../listings/imeeting';
import { Base } from './base.class';
import { Id, IId } from './id.class';
import { IUserRating, UserRatingStatus } from './user-rating';
import { IUserBase, UserBase } from './userBase.class';


export enum UserAuthorizationEnum {
    NONE = 0,
    MAKER,
    ATTENDANCE,
    FREE,
    ADMIN
}
export interface IUserAuthorization extends IId {
    uid: string;

    admin: boolean;
    free: boolean;
    attendance: boolean;
    maker: boolean;

    value: UserAuthorizationEnum;
    subscriber: boolean;

    updated$: string;
    updated: number;
}

export class UserAuthorization extends Id implements IUserAuthorization {

    public get value(): UserAuthorizationEnum {
        // ordering here is important
        if (this.admin) return UserAuthorizationEnum.ADMIN;
        if (this.free) return UserAuthorizationEnum.FREE;
        if (this.attendance) return UserAuthorizationEnum.ATTENDANCE;
        if (this.maker) return UserAuthorizationEnum.MAKER;

        return UserAuthorizationEnum.NONE;
    }

    public get subscriber(): boolean {
        return this.value !== UserAuthorizationEnum.NONE;
    }

    uid: string = '';

    admin: boolean = false;
    free: boolean = false;
    attendance: boolean = false;
    maker: boolean = false;

    updated$: string = ''
    updated: number = <any>null;

    constructor(data?: IUserAuthorization) {
        super(data);
        this.initialize(this, data);
        this.update();
    }

    update() {
        this.updated = DateTime.now().toMillis();
        this.updated$ = DateTime.now().toLocaleString(DateTime.DATETIME_SHORT);
    }
}


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
    sobriety_value: number;
    sobriety_days: boolean;
    location: boolean;
    location_value: string;
    nintey_start: number;   // date to start 90/90
    nintey_mtgs: number;    // in person count
    nintey_mins: number;    // minutes of in person
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
    processed: number;
    processed$: string;
    timestamp: number;                  // last update ts

    rating_status: string;              // users last rating request result
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

    app_runs_max: number;
    app_runs_avg_7: number;
    app_runs_avg_14: number;
    app_runs_avg_28: number;
    app_runs_avg_2m: number;
    app_runs_avg_4m: number;
    app_runs_avg_6m: number;
    app_runs_avg_1y: number;

    meeting_last: number;
    meeting_last$: string;              // updated by joinMeeting()
    meeting_count_total: number;        // updated by joinMeetings()
    meeting_count_today: number;        // updated by joinMeetings(), reset to 0 by nightly process to use in calculating running averages
    meeting_count_data: number[];       // array of previous meeting_count_today values

    meeting_count_max: number;          // max daily meeting count
    meeting_count_avg_7: number;        // 7 day running average meetings per day
    meeting_count_avg_14: number;       // 14 day
    meeting_count_avg_28: number;       // 27 day
    meeting_count_avg_2m: number;       // 2 month
    meeting_count_avg_4m: number;       // 4 month
    meeting_count_avg_6m: number;       // 6 month running average meetings per day
    meeting_count_avg_1y: number;       // 1 year running average meetings per day

    appRun(): void;
    appRatingPrompt(rating: IUserRating): void;
    meetingCount(meeting: IMeeting): void;
    process(): void;
}

export interface IUser extends IUserBase {
    uaid: string,
    preferences: IUserPreferences,
    profile: IUserProfile;
    favMeetings: string[];
    blkMeetings: string[];

    created: number;
    created$: string;

    addFavoriteMeeting(mid: string): boolean;
    removeFavoriteMeeting(mid: string): boolean;

    setUserAuthNames(displayName?: string): boolean;
    setUserNames(firstName: string, lastInitial: string): boolean;
}

declare const ONLINE_ACTIVITY = 15;
export class User extends UserBase implements IUser {
    uaid: string = '';
    preferences: IUserPreferences = {
        apptag: true,
        homemeeting: false,
        pronouns: false,
        pronouns_value: '',
        sobriety: false,
        sobriety_value: DateTime.now().startOf('day').toMillis(),
        sobriety_days: false,
        location: false,
        location_value: '',
        nintey_start: DateTime.now().startOf('day').toMillis(),
        nintey_mtgs: 0,
        nintey_mins: 0

    }
    profile: IUserProfile = <any>null;
    homeMeeting: string = <any>null;
    favMeetings: any[] = [];
    blkMeetings: any[] = [];

    _created = DateTime.now().toMillis();   // Because the below is somehow showing up as an ISO time in the cloud
    created = DateTime.now().toMillis();
    created$ = DateTime.now().toLocaleString(DateTime.DATETIME_SHORT);

    constructor(user?: any) {
        super(user);

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
    }

    toObject(): IUser {
        return super.toObject([]);
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
}
export class UserStats extends Id implements IUserStats {
    version = 1;    // TODO add version upgrade code 

    uid = '';

    created = DateTime.now().toMillis();
    created$ = DateTime.now().toLocaleString(DateTime.DATETIME_SHORT);

    processed = -1;
    processed$ = '';
    timestamp = DateTime.now().toMillis();  // last update ts

    run_duration = 0;
    run_duration$ = '';

    rating_status = UserRatingStatus.NONE;
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
    app_runs_max = 0;
    app_runs_avg_7 = 0;
    app_runs_avg_14 = 0;
    app_runs_avg_28 = 0;
    app_runs_avg_2m = 0;
    app_runs_avg_4m = 0
    app_runs_avg_6m = 0;
    app_runs_avg_1y = 0;

    meeting_count_today = 0;
    meeting_count_total = 0;

    meeting_count_data: number[] = [];
    meeting_count_max = 0;
    meeting_count_avg_7 = 0;
    meeting_count_avg_14 = 0;
    meeting_count_avg_28 = 0;
    meeting_count_avg_2m = 0;
    meeting_count_avg_4m = 0;
    meeting_count_avg_6m = 0;
    meeting_count_avg_1y = 0;

    meeting_last = <any>null;
    meeting_last$ = <any>null;

    constructor(userStats?: any) {
        super(userStats);
        this.initialize(this, userStats);
    }

    process() {
        this.app_runs_data = [this.app_runs_today, ...this.app_runs_data].slice(0, 365);
        this.app_runs_today = 0;
        this.app_runs_max = max(this.app_runs_data);
        this.app_runs_avg_7 = mean(this.app_runs_data.slice(0, 7));
        this.app_runs_avg_14 = mean(this.app_runs_data.slice(0, 14));
        this.app_runs_avg_28 = mean(this.app_runs_data.slice(0, 28));
        this.app_runs_avg_2m = mean(this.app_runs_data.slice(0, 60));
        this.app_runs_avg_4m = mean(this.app_runs_data.slice(0, 120));
        this.app_runs_avg_6m = mean(this.app_runs_data.slice(0, 180));
        this.app_runs_avg_1y = mean(this.app_runs_data.slice(0, 365));

        this.meeting_count_data = [this.meeting_count_today, ...this.meeting_count_data].slice(0, 365);
        this.meeting_count_today = 0;
        this.meeting_count_max = max(this.meeting_count_data);
        this.meeting_count_avg_7 = mean(this.meeting_count_data.slice(0, 7));
        this.meeting_count_avg_14 = mean(this.meeting_count_data.slice(0, 14));
        this.meeting_count_avg_28 = mean(this.meeting_count_data.slice(0, 28));
        this.meeting_count_avg_2m = mean(this.meeting_count_data.slice(0, 60));
        this.meeting_count_avg_4m = mean(this.meeting_count_data.slice(0, 120));
        this.meeting_count_avg_6m = mean(this.meeting_count_data.slice(0, 180));
        this.meeting_count_avg_1y = mean(this.meeting_count_data.slice(0, 365));

        this.processed = DateTime.now().toMillis();
        this.processed$ = DateTime.now().toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS);
    }

    appRun() {
        this.timestamp = DateTime.now().toMillis();
        this.app_run_last = DateTime.now().toMillis();
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
        this.rating_status = rating.status;
        if (rating.rate) this.rating_ratings += 1;
        if (rating.enjoy) this.rating_enjoys += 1;
        if (rating.remind) this.rating_reminds += 1;
        if (rating.feedback) this.rating_feedback += 1;
        if (rating.feedback_declined) this.rating_feedback_decline += 1;
    }

    meetingCount(meeting: IMeeting) {
        this.timestamp = DateTime.now().toMillis();
        this.meeting_last = DateTime.now().toMillis();
        this.meeting_last$ = DateTime.now().toLocaleString(DateTime.DATETIME_SHORT);
        this.meeting_count_total += 1;
        this.meeting_count_today += 1;
    }
}
