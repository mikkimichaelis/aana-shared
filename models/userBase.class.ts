import * as _ from 'lodash';
import { Id, IId } from './id.class';

export interface IUserBase extends IId {
    name: string;
}

export class UserBase extends Id implements IUserBase {
    name!: string;

    constructor(user?: any, defaults?: any) {
        super(user, _.merge(defaults, {
            name: 'Anonymous'
        }));
    }
}
