import { IAddress } from ".";

export interface ILocation extends IAddress {
    name: string;
    notes: string;
};