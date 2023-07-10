import { IAddress } from './address';

export interface ILocation extends IAddress {
    name: string;
    notes: string;
};