import * as _ from 'lodash-es';
import { IAddress } from ".";

export interface ILocation extends IAddress {
    name: string;
    notes: string;
};