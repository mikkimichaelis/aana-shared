import * as _ from 'lodash';
import { IAddress } from ".";
import { Base } from './base.class';

export interface ILocation extends IAddress {
    name: string;
    notes: string;
};

export class Location extends Base implements ILocation {
    name!: string;
    notes!: string;
    address1!: string;
    address2!: string;
    city!: string;
    state!: string;
    zip!: string;

    constructor(location?: any) {
        super()
        this.initialize( this, location, {
            name: '',
            notes: '',
            address1: '',
            address2: '',
            city: '',
            state: '',
            zip: '',
        });
    }
}