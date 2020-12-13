import _ from 'lodash';
import { IUser, IGroup } from '../models';

export class UserBLLService {

  static isHomeGroup(user: IUser, group: IGroup): boolean {
    return group.id === (_.has(user, 'homeGroup.gid') ? user.homeGroup.gid : false);
  }
}
