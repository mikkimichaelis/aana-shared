import { DateTime } from "luxon";
import { Id, IId } from "./id.class.js";

export interface IJournalEntry extends IId {
    // uid: string;
    // rating: number;
    // feelings: IFeeling[];
    key: number;
    date: string;
    emoji: string;
    title: string;
    gratitude: string;
    great: string;
    affirmations: string;
    highlights: string;
    better: string;
    accomplishments: string;
}

export interface IFeeling {
    emoji: number;
    time: number;
}

export class JournalEntry extends Id implements IJournalEntry {
    // uid: string = '';
    // rating: number = 0;
    // feelings: IFeeling [] = [];

    public get key(): number {
        return Number.parseInt(this.id);
    }
    public date = '';
    public emoji = '';
    public title = '';
    public gratitude = '';
    public great = '';
    public affirmations = '';
    public highlights = '';
    public better = '';
    public accomplishments  = '';

    constructor(entry?: IJournalEntry) {
        // construct from entry otherwise construct a blank one with a proper id for today
        super(entry ? entry : { id: DateTime.now().startOf('day').toMillis().toString() });
        this.initialize(this, entry);

        // Defaulting here so entries missing dates will have one added when loaded
        this.date = DateTime.fromMillis(Number.parseInt(this.id)).toLocaleString(DateTime.DATETIME_FULL);
    }
    public toObject() {
        return super.toObject(['key']);
    }
}