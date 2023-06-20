import lodash from 'lodash';
// import * as geofirex from 'geofirex';

export interface IBase {
    toObject(exclude?: string[]): any;
    toGeoObject(geo?: any, exclude?: string[]): any;
}

export class Base implements IBase {
    // constructor(source?: any, defaults?: any, exclude?: string[]) {
    //     this.deepCopy(this, source, Object.keys(defaults), exclude);
    // }

    public initialize(object: any, source?: any) {
        this.deepCopy(object, source, [], true);
    }

    public deepCopy(destination: any, source: any, exclude?: string[], existing?: boolean): any {
        // const sourceKeys = source ? Object.keys(source): [];
        // const defaultKeys = defaults ? Object.keys(defaults): [];
        // const excludeKeys = exclude ? Object.keys(exclude): [];

        if (source) {
            for (const key in source) {
                // not doing an existing property copy or we are and the destination has the existing property
                if (!existing || destination[key]) {
                    // are we specifically excluding this key?
                    if (lodash.indexOf(exclude, key) === -1) {
                        let value = source[key];
                        
                        if (!value) {
                            destination[key] = value;
                        }
                        else if (typeof value !== "object") {
                            destination[key] = value
                        } else {
                            // if is an array, deepCopy the array non existing 
                            if (Array.isArray(value)) {
                                destination[key] = [];
                                this.deepCopy(destination[key], value, exclude, false);
                            } else if (value['toObject'] !== undefined) {
                                destination[key] = value.toObject();
                            } else if (value['toObject'] === undefined) {
                                destination[key] = value;
                            } else {
                                if (key === 'point') {
                                    // point properties are already Firebase GeoPoint type, use existing object
                                    destination[key] = value;
                                } else {
                                    destination[key] = {};
                                    this.deepCopy(destination[key], value, exclude, false);
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

    public toGeoObject(geo?: any, exclude?: string[]) {
        const obj = this.toObject(exclude);
        if (geo && obj['point'] && !lodash.isEmpty(obj.point)) obj.point = geo.point(obj.point.geopoint._latitude, obj.point.geopoint._longitude);
        return obj;
    }
}