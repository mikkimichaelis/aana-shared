import { findIndex, merge, remove } from 'lodash';
import { DateTime, Duration } from 'luxon';
import { max, mean } from 'mathjs';
import { IMeeting } from '../listings';
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

    value: UserAuthorizationEnum;
    authorized: boolean;

    updated$: string;
    updated: number;
}

export class UserAuthorization extends Id implements IUserAuthorization {

    public get authorized(): boolean {
        return this.value > UserAuthorizationEnum.NONE;
    }

    public get value(): UserAuthorizationEnum {
        if (this.admin) return UserAuthorizationEnum.ADMIN;
        if (this.free) return UserAuthorizationEnum.FREE;

        // use the running app environment to determine which subscriptions to validate for
        if (this.environment.platform === 'device') {
            if (this.environment.design === 'ios') {
                // @ts-ignore
                if (this['apple:live.aana.app.attendance.subscription:owned'] === true) return UserAuthorizationEnum.ATTENDANCE;
            } else {    // md
                // @ts-ignore
                if (this['google:live.aana.app.attendance.subscription:owned'] === true) return UserAuthorizationEnum.ATTENDANCE;
                // @ts-ignore
                if (this['google:live.meetingmaker.app.attendance_sub:owned'] === true) return UserAuthorizationEnum.ATTENDANCE;
                // @ts-ignore
                if (this['google:live.meetingmaker.app.maker_sub:owned'] === true) return UserAuthorizationEnum.MAKER;
            }
        } else {        // spa
            return UserAuthorizationEnum.ATTENDANCE;
        }

        if (this.attendance) return UserAuthorizationEnum.ATTENDANCE;

        return UserAuthorizationEnum.NONE;
    }

    uid: string = '';

    admin: boolean = false;
    free: boolean = false;
    attendance: boolean = false;
    maker: boolean = false;

    updated$: string = ''
    updated: number = <any>null;

    private environment: any;

    // pass in running app environment to determine attendance platform
    constructor(data: IUserAuthorization = <any>{}, environment?: any,) {
        super(data);
        this.deepCopy(this, data, [], false);
        this.update();
        this.environment = environment;
    }

    update() {
        this.updated = DateTime.now().toMillis();
        this.updated$ = DateTime.now().toLocaleString(DateTime.DATETIME_SHORT);
    }

    toObject(): IUser {
        return super.toObject(['authorized', 'value', 'environment']);
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
    // deprecated due to spelling error 
    nintey_start: number;   // date to start 90/90
    nintey_mtgs: number;    // in person count
    nintey_mins: number;    // minutes of in person

    ninety_start: number;   // date to start 90/90
    meetingMinutesChartDuration: any;
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

    app_run_last: number;
    app_runs_total: number;             // updated every time the app starts +1
    app_runs_today: number;             // updated ever app start, reset to 0 by nightly process to use in calculating running averages

    meeting_last: number;
    meeting_last$: string;
    meeting_last_name: string;          
    meeting_count_total: number;
    meeting_count_today: number;        // updated by meetingCount(), reset to 0 by nightly process to use in calculating running averages

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
    adHocMeetings: string[];
    blkMeetings: string[];

    created: number;
    created$: string;

    addFavoriteMeeting(mid: string): boolean;
    removeFavoriteMeeting(mid: string): boolean;

    addAdHocMeeting(mid: string): boolean;
    removeAdHocMeeting(mid: string): boolean;

    setUserAuthNames(displayName?: string): boolean;
    setUserNames(firstName: string, lastInitial: string): boolean;
}

declare const ONLINE_ACTIVITY = 15;
export class User extends UserBase implements IUser {
    uaid: string = '';  // depreciated
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

        // deprecated
        nintey_start: DateTime.now().startOf('day').toMillis(),
        nintey_mtgs: 0,
        nintey_mins: 0,

        ninety_start: 0,

        meetingMinutesChartDuration: 7

    }
    profile: IUserProfile = <any>null;
    homeMeeting: string = <any>null;
    favMeetings: any[] = [];
    adHocMeetings: string[] = [];
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
        if (user?.profile) {
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

    public isAdHocMeeting(mid: string): boolean {
        return -1 !== findIndex(this.adHocMeetings, (id => {
            return (id === mid);
        }))
    }

    public addAdHocMeeting(mid: string): boolean {
        this.removeAdHocMeeting(mid);
        this.adHocMeetings.unshift(mid);
        return true;
    }

    public removeAdHocMeeting(mid: string): boolean {
        const i = this.adHocMeetings.findIndex(_mid => _mid === mid)
        if (i > -1) this.adHocMeetings.splice(i, 1);
        return true;
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
    version = 2;    // TODO add version upgrade code 

    uid = '';

    created = DateTime.now().toMillis();
    created$ = DateTime.now().toLocaleString(DateTime.DATETIME_SHORT);
    timestamp = DateTime.now().toMillis();  // last update ts
    timezone = DateTime.local().zoneName;

    processed = -1;
    processed$ = '';

    run_duration = 0;
    run_duration$ = '';

    rating_status = UserRatingStatus.NONE;
    rating_prompts = 0;
    rating_enjoys = 0;
    rating_ratings = 0;
    rating_reminds = 0;
    rating_feedback = 0;

    app_run_last = 0;
    app_runs_total = 0;
    app_runs_today = 0;

    meeting_count_today = 0;
    meeting_count_total = 0;

    meeting_last = <any>null;
    meeting_last$ = <any>null;
    meeting_last_name = '';

    constructor(userStats?: any) {
        super(userStats);
        this.initialize(this, userStats);
    }

    process() {
        this.timestamp = DateTime.now().toMillis();
        this.app_runs_today = 0;
        this.meeting_count_today = 0;

        this.processed = DateTime.now().toMillis();
        this.processed$ = DateTime.now().toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS);
    }

    appRun() {
        this.timestamp = DateTime.now().toMillis();
        this.app_run_last = DateTime.now().toMillis();
        this.app_runs_total = this.app_runs_total + 1;
        this.app_runs_today = this.app_runs_today + 1;
    }

    duration(ms: number) {
        this.timestamp = DateTime.now().toMillis();
        this.run_duration = this.run_duration + ms;
        this.run_duration$ = Duration.fromMillis(this.run_duration).toFormat('yy:dd:hh:mm:ss');
    }

    appRatingPrompt(rating: IUserRating) {
        this.timestamp = DateTime.now().toMillis();
        this.rating_prompts = this.rating_prompts + 1;
        this.rating_status = rating.status;
        if (rating.rate) this.rating_ratings = this.rating_ratings + 1;
        if (rating.enjoy) this.rating_enjoys = this.rating_enjoys + 11;
        if (rating.remind) this.rating_reminds = this.rating_reminds + 1;
        if (rating.feedback) this.rating_feedback = this.rating_feedback + 1;
    }

    meetingCount(meeting: IMeeting) {
        this.timestamp = DateTime.now().toMillis();
        this.meeting_last = DateTime.now().toMillis();
        this.meeting_last$ = DateTime.now().toLocaleString(DateTime.DATETIME_SHORT);
        this.meeting_last_name = meeting.name;
        this.meeting_count_total = this.meeting_count_total + 1;
        this.meeting_count_today = this.meeting_count_today + 1;
    }
}
