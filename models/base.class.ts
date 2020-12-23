import * as _ from 'lodash';
import * as geofirex from 'geofirex';

export interface IBase {
    toObject(exclude?: string[]): any;
    toGeoObject(geo?: geofirex.GeoFireClient, exclude?: string[]): any;
}

export class Base implements IBase {
    // constructor(source?: any, defaults?: any, exclude?: string[]) {
    //     this.deepCopy(this, source, Object.keys(defaults), exclude);
    // }

    public initialize(object: any, source: any) {
        this.deepCopy(object, source, [], true);
    }

    private deepCopy(destination: any, source: any, exclude?: string[], existing?: boolean): any {
        // const sourceKeys = source ? Object.keys(source): [];
        // const defaultKeys = defaults ? Object.keys(defaults): [];
        // const excludeKeys = exclude ? Object.keys(exclude): [];

        if (source) {
            for (const key in source) {
                // not doing an existing property copy or we are and the destination has an existing dest property
                if (!existing || _.has(destination, key)) {
                    // are we specifically excluding this key?
                    if (_.indexOf(exclude, key) === -1) {
                        // if not an object, perform simple assignment
                        if (typeof source[key] !== "object") {
                            destination[key] = source[key];
                        } else {
                            // if is an array, deepCopy the array non existing 
                            if (Array.isArray(source[key])) {
                                //destination[key] = _.cloneDeep(source[key]);
                                destination[key] = [];
                                this.deepCopy(destination[key], source[key], exclude, false);
                            } else {
                                if (key === 'point') {  
                                    // point properties are already Firebase GeoPoint type, use existing object
                                    destination[key] = source[key];
                                } else {
                                    destination[key] = {};
                                    this.deepCopy(destination[key], source[key], exclude, false);
                                }
                            }
                        }
                    }
                }
            }
        }
        return destination;
    }

    // exclude attached properties (ie Group.schedules)
    public toObject(exclude?: string[]): any {
        return JSON.parse(JSON.stringify(this.deepCopy({}, this, exclude)));
    }

    public toGeoObject(geo?: geofirex.GeoFireClient, exclude?: string[]) {
        const obj = this.toObject(exclude);
        if (geo && _.has(obj, 'point') && !_.isEmpty(obj.point)) obj.point = geo.point(obj.point.geopoint._latitude, obj.point.geopoint._longitude);
        return obj;
    }
}