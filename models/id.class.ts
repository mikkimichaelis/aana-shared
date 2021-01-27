import firebase from 'firebase';
import * as geofirex from 'geofirex';
import * as _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { Base, IBase } from './base.class';

export interface IId extends IBase {
    id: string;

    // todo move to Audit class
    ts: {
        createdAt: any;
        updatedAt: any;
    }
}

export class Id extends Base implements IId {
    id: string  = uuidv4();

    ts = { 
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }

    constructor(id?: any) { // IId
        super();
        this.initialize(this, id);

        if (!this.ts.createdAt) {
            this.ts.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        }
    }

    public toObject(exclude?: string[]): any {
        const ts_createdAt = this.ts.createdAt;
        const obj = super.toObject(exclude);
        obj.ts.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        obj.ts.createdAt = ts_createdAt;
        return obj;
    }

    public toGeoObject(geo?: geofirex.GeoFireClient, exclude?: string[]) {
        const obj = super.toGeoObject(geo, exclude);
        obj.ts.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        return obj;
    }
}