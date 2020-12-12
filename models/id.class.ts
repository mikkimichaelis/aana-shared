import * as _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { Base, IBase } from './base.class';

export interface IId extends IBase {
    id: string;
}

export class Id extends Base implements IId {
    id!: string;

    constructor(data?: any, defaults?: any) {
        super(data, _.merge(defaults, {
            id: uuidv4(),
        }));

    }
}