import * as _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { Base, IBase } from './base.class';
export interface IId extends IBase {
    id: string;

    // todo move to Audit class
    //createdAt: firebase.firestore.Timestamp | any;
    //updatedAt: firebase.firestore.Timestamp | any;
}

export class Id extends Base implements IId {
    id: string  = uuidv4();
    //createdAt = firebase.firestore.FieldValue.serverTimestamp();
    //updatedAt = firebase.firestore.FieldValue.serverTimestamp();

    constructor(id?: any) { // IId
        super();
        this.initialize(this, id);

        // if (!this.createdAt) {
            // this.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        // }
    }

    public toObject(exclude?: string[]): any {
        // const ts_createdAt = this.createdAt;
        const obj = super.toObject(exclude);
        // obj.createdAt = ts_createdAt;
        // obj.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        return obj;
    }

    // public toGeoObject(geo?: geofirex.GeoFireClient, exclude?: string[]) {
    //     // const ts_createdAt = this.createdAt;
    //     const obj = super.toGeoObject(geo, exclude);
    //     // obj.createdAt = ts_createdAt;
    //     // obj.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    //     return obj;
    // }
}