import * as _ from 'lodash';
import { IAddress } from ".";

export interface ILocation extends IAddress {
    name: string;
    notes: string;
};