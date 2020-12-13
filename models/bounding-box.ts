import * as _ from 'lodash';
import { Base } from "./base.class";

export interface IBoundingBox {
    latBottomLeft: number;
    lonBottomLeft: number;
    latTopRight: number;
    lonTopRight: number;
};

export class BoundingBox extends Base implements IBoundingBox {
    latBottomLeft: number  = 0;
    lonBottomLeft: number  = 0;
    latTopRight: number    = 0;
    lonTopRight: number    = 0;

    constructor(boundingBox?: BoundingBox) {
        super();
        this.initialize(this, boundingBox);
    }
}