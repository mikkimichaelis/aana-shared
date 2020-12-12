import { Injectable } from '@angular/core';
import _ from 'lodash';
import { IUser, IGroup } from '../models';
import { IUserBLLService } from '.';

@Injectable({
  providedIn: 'root'
})
export class UserBLLService implements IUserBLLService{

  constructor() { }
  isHomeGroup(user: IUser, group: IGroup): boolean {
    return group.id === (_.has(user, 'homeGroup.gid') ? user.homeGroup.gid : false);
  }
}
