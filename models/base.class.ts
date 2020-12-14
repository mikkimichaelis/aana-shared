import * as _ from 'lodash';

export interface IBase {
    toObject(exclude?: string[]): any;
}

export class Base implements IBase {
    // constructor(source?: any, defaults?: any, exclude?: string[]) {
    //     this.deepCopy(this, source, Object.keys(defaults), exclude);
    // }

    public initialize(object: any, source: any) {
        if (source) {
            _.mergeWith(object, source, (objValue: any, srcValue: any, key: any, obj: any, src: any, stack: any) => {
                if (objValue !== undefined) {
                    return srcValue;
                }
            });
        }
    }

    private deepCopy(destination: any, source: any, exclude?: string[]): any {
        // const sourceKeys = source ? Object.keys(source): [];
        // const defaultKeys = defaults ? Object.keys(defaults): [];
        // const excludeKeys = exclude ? Object.keys(exclude): [];

        if (source) {
            for (const key in source) {
                if (!(exclude && _.indexOf(exclude, key) === -1)) {
                    if (typeof source[key] !== "object") {
                        destination[key] = source[key];
                    } else {
                        if (Array.isArray(source[key])) {
                            destination[key] = [];
                        } else {
                            destination[key] = {};
                        }
                        this.deepCopy(destination[key], source[key], exclude);
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
}