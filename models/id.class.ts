import * as _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { Base } from './base.class';

export interface IId {
    id: string;
}

export class Id extends Base implements IId {
    id!: string;

    constructor(data?: any) {
        super(_.merge({
            id: '',
            name: ''
        }, data));
        this.id = _.defaultTo(this.id, uuidv4());
    }
}