import * as _ from 'lodash';
import { Id } from './id.class';

export interface IUserBase {
    id: string;
    name: string;
}

export class UserBase extends Id implements IUserBase {
    base!: IUserBase;
    name!: string;

    constructor(user?: any) {
        super(_.merge({
            user: ''
        }, user));
        this.name = _.defaultTo(this.name, 'Anonymous');
    }
}
