import * as _ from 'lodash';

export interface IBase {
    toObject(exclude?: string[]): any;
}

export class Base implements IBase {
    constructor(source?: any, obj?: any, exclude?: string[]) {
        if (source) this.deepCopy(this, source, Object.keys(obj), exclude);
    }

    private deepCopy(destination: any, source: any, include?: any, exclude?: string[]): any {
        if (source) {
            for (const key in source) {
                if ((include && _.indexOf(include, key) !== -1)
                    && (exclude && _.indexOf(exclude, key) === -1)) {
                    if (typeof source[key] !== "object") {
                        destination[key] = source[key];
                    } else {
                        if (Array.isArray(source[key])) {
                            destination[key] = [];
                        } else {
                            destination[key] = {};
                        }
                        this.deepCopy(destination[key], source[key], include, exclude);
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