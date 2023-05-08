import { DateTime } from "luxon";
import { Id, IId } from "./id.class";

// This defines the persisted record for all meeting notes on a single day
export interface IDailyNote {
    id: string;     // record string index - millis start of day
    meetings: IMeetingNote[];
}

export interface IMeetingNote extends IId {
    id: string;             // key in database - millis of start of day note is for
    timestamp: number;      // get property returns id as number 
    date$: string;          // string of date note created

    uid: string;
    mid: string;
    name: string;           // meeting name

    stars: number;
    html: string;
}

export class MeetingNote extends Id implements IMeetingNote {

    public id: string = '';

    public timestamp: number = 0;
    public date$: string = ''

    public uid: string = '';
    public mid: string = '';
    public name: string = '';

    public stars: number = 0;
    public html: string = '<p></p>';

    constructor(note?: any) {
        super(note);
        this.initialize(this, note);

        if (!this.timestamp) this.timestamp = DateTime.now().startOf('day').toMillis();
        if (!this.id) this.id = this.timestamp.toString();

        this.date$ = DateTime.fromMillis(this.timestamp).toISO();
    }

    public toObject() {
        return super.toObject();
    }
}