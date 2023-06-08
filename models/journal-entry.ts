import { DateTime } from "luxon";
import { Base, IBase } from "./base.class";

export interface IJournalEntry extends IBase {
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

export class JournalEntry extends Base implements IJournalEntry {
    public date = DateTime.now().toFormat('yyyy-MM-dd');

    public emoji = '';
    public title = '';
    public gratitude = '';
    public great = '';
    public affirmations = '';
    public highlights = '';
    public better = '';
    public accomplishments  = '';

    constructor(entry?: IJournalEntry) {
        super();
        this.initialize(this, entry);
    }
    public toObject() {
        return super.toObject();
    }
}