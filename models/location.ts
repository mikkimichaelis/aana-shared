import { IAddress } from './address.js';

export interface ILocation extends IAddress {
    name: string;
    notes: string;
};