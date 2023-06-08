import { DateTime } from "luxon";
import { Base, IBase } from "./base.class";

// This defines the persisted record for all meeting notes on a single day
export interface IDailyNote {
    date: string;     // record string index - millis start of day
    meetings: IMeetingNote[];
}

export interface IMeetingNote extends IBase {
    date: string;           // date of note (mirrors IDailyNote date)
    
    uid: string;
    mid: string;
    name: string;           // meeting name

    stars: number;
    html: string;
}

export class MeetingNote extends Base implements IMeetingNote {

    public date: string = DateTime.now().toFormat('yyyy-MM-dd')

    public uid: string = '';
    public mid: string = '';
    public name: string = '';

    public stars: number = 0;
    public html: string = '<p></p>';

    constructor(note?: any) {
        super();
        this.initialize(this, note);
    }

    public toObject() {
        return super.toObject();
    }
}