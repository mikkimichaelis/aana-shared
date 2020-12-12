import { IUser, IGroup } from 'src/shared/models';

export interface IUserBLLService {
  isHomeGroup(user: IUser, group: IGroup): boolean;
}
