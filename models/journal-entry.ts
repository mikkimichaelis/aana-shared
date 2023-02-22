import { Id, IId } from "./id.class";

export interface IJournalEntry extends IId {
    uid: string;

    rating: number;
    feelings: IFeeling[];

    title: string;

    gratitude: string;
    great: string;
    affirmations: string;
    highlights: string;
    better: string;
    accomplishments: string;

    date: number;
    date$: string;
}

export interface IFeeling {
    emoji: number;
    time: number;
}

export class JournalEntry extends Id implements IJournalEntry {
    uid: string = '';

    rating: number = 0;
    feelings: IFeeling [] = [];

    public title = '';
    public gratitude = '';
    public great = '';
    public affirmations = '';
    public highlights = '';
    public better = '';
    public accomplishments  = '';

    date: number = 0;
    date$: string = '';

    constructor(entry?: IJournalEntry) {
        super(entry);
        this.initialize(this, entry);
    }
}