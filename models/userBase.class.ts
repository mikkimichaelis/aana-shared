import * as _ from 'lodash';
import { Id, IId } from './id.class';

export interface IUserBase extends IId {
    name: string;
}

export class UserBase extends Id implements IUserBase {
    name!: string;

    constructor(userBase?: any) {
        super(userBase);
        this.initialize(this, userBase);
    }
}
