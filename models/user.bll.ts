import { DateTime } from "luxon";
import { IGroup, IUser, IUserActivity, IUserMember, HomeGroup, UserMember, IUserProfile } from ".";

// TODO move to config
declare const ONLINE_ACTIVITY = 15;

export class UserBLL {
    static makeHomeGrouo(user: any, group: any) {
        throw new Error('Method not implemented.');
    }
    public static isOnline(user: IUserActivity): boolean {
        const lastActivity: DateTime = DateTime.fromISO(user.lastTime).toLocal();
        return DateTime.local().diff(lastActivity).minutes < ONLINE_ACTIVITY;
    }

    public static daysSinceBday(user: IUserMember ) {
        const bday:DateTime = DateTime.fromISO(user.bday);
        return DateTime.local().toUTC().diff(bday).days;
    }

    public static setUserAuthNames(profile: IUserProfile, displayName?: string): boolean {
        if (profile.anonymous
            // || TODO displayName is all whitespace
            || displayName === undefined
            || displayName === null
            || !displayName.includes(' ')
            || displayName.length < 3
            || displayName.split(' ').length < 2) {
            profile.firstName = 'Anonymous';
            profile.lastInitial = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
        } else {
            const names = displayName.split(' ');
            profile.firstName = names[0];
            profile.lastInitial = names[1][0].toUpperCase();
        }
        profile.name = `${profile.firstName} ${profile.lastInitial}.`;
        return true;
    }

    public static setUserNames(profile: IUserProfile, firstName: string, lastInitial: string): boolean {
        if (!firstName 
            || !lastInitial
            || firstName.length > 25
            || lastInitial.length !== 1) {
            return false;
        }
        profile.firstName = firstName;
        profile.lastInitial = lastInitial;
        profile.name = `${firstName} ${lastInitial}.`;
        return true;
    }

    public static makeHomeGroup(user: IUser, group: IGroup) {
        // TODO error check not duplicate add
        if( !group.members ) group.members = [];
        group.members.push(new UserMember(user).toObject());
        user.homeGroup = new HomeGroup(group).toObject();
    }
}