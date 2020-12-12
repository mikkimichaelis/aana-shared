import * as _ from 'lodash';
import { Base } from "./base.class";

export interface IBoundingBox {
    latBottomLeft: number;
    lonBottomLeft: number;
    latTopRight: number;
    lonTopRight: number;
};

export class BoundingBox extends Base implements IBoundingBox {
    latBottomLeft!: number;
    lonBottomLeft!: number;
    latTopRight!: number;
    lonTopRight!: number;

    constructor(boundingBox?: BoundingBox) {
        super(_.merge({
            latBottomLeft: 0,
            lonBottomLeft: 0,
            latTopRight: 0,
            lonTopRight: 0,
        },
            boundingBox));
    }
}