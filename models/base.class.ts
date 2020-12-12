import * as _ from 'lodash';

export interface IBase {
    toObject(exclude?: string[]): any;
}

export class Base implements IBase {
    constructor(source?: any, defaults?: any, exclude?: string[]) {
        this.deepCopy(this, source, Object.keys(defaults), exclude);
    }

    private deepCopy(destination: any, source: any, defaults?: any, exclude?: string[]): any {
        const sourceKeys = source ? Object.keys(source): [];
        const defaultKeys = defaults ? Object.keys(defaults): [];
        const excludeKeys = exclude ? Object.keys(exclude): [];

        if (source) {
            for (const key in source) {
                if ((defaults && _.indexOf(defaults, key) !== -1)
                    && (exclude && _.indexOf(exclude, key) === -1)) {
                    if (typeof source[key] !== "object") {
                        destination[key] = source[key];
                    } else {
                        if (Array.isArray(source[key])) {
                            destination[key] = [];
                        } else {
                            destination[key] = {};
                        }
                        this.deepCopy(destination[key], source[key], defaults, exclude);
                    }
                }
            }
        }
        return destination;
    }

    public toObject(exclude?: string[]): any {
        return JSON.parse(JSON.stringify(this.deepCopy({}, this, exclude)));
    }
}