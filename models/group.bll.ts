import * as _ from 'lodash';
import { UserBLL } from '../bll';
import { IGroup } from './group.interface';
import { IUserMember } from './userMember.class';

export class GroupBLL {

    public static tagsString(group: IGroup): string {
        if( Array.isArray(group.tags) ) {
            return group.tags.join(' ');
        } else {
            return '';
        }
    }

    public static memberCount(group: IGroup): number {
        if( Array.isArray(group.members) ) {
            return group.members.length;
        } else {
            return 0;
        }
    }

    public static yearsSobriety(group: IGroup): number {
        if( Array.isArray(group.members) ) {
            // TODO check algorithm
            return _.sum(_.map(group.members, (member:IUserMember) => {
                return UserBLL.daysSinceBday(member)
            })) / 365;
        } else {
            return 0;
        }
    }

    public static membersOnline(group: IGroup): number {
        if( Array.isArray(group.members) ) {
            // TODO check algorithm
            return _.sum(_.map(group.members, (member:IUserMember) => {
                return UserBLL.isOnline(member.lastActivity) ? 1 : 0;
            })) / 365;
        } else {
            return 0;
        }
    }

}