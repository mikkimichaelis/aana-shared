import { DateTime } from 'luxon';
import { makeThat70sDateTime } from '../shared/models/meeting';
import { Meeting } from './meeting';

describe('makeThat70sDateTime', () => {
  it('should return a DateTime object with the correct year, month, and day', () => {
    const time24h = '12:30';
    const zone = 'America/New_York';
    const weekday = 'Monday';

    const result = makeThat70sDateTime(time24h, zone, weekday);

    expect(result).toBeInstanceOf(DateTime);
    expect(result.year).toBe(1970);
    expect(result.month).toBe(1);
    expect(result.day).toBe(5); // Assuming Monday is the 5th day of the week in the 70s
  });

  it('should return a DateTime object in the specified timezone', () => {
    const time24h = '12:30';
    const zone = 'America/Los_Angeles';
    const weekday = 'Monday';

    const result = makeThat70sDateTime(time24h, zone, weekday);

    expect(result).toBeInstanceOf(DateTime);
    expect(result.zoneName).toBe('America/Los_Angeles');
  });

  it('should return a DateTime object in UTC if the "utc" parameter is true', () => {
    const time24h = '12:30';
    const zone = 'America/New_York';
    const weekday = 'Monday';
    const utc = true;

    const result = makeThat70sDateTime(time24h, zone, weekday, utc);

    expect(result).toBeInstanceOf(DateTime);
    expect(result.zoneName).toBe('UTC');
  });
});describe('makeFrom24h_That70sDateTime', () => {
  it('should return a DateTime object with the correct hour and minute', () => {
    const time24h = '12:30';
    const zone = 'America/New_York';
    const weekday = 'Monday';

    const result = Meeting.makeFrom24h_That70sDateTime(time24h, zone, weekday);

    expect(result).toBeInstanceOf(DateTime);
    expect(result.hour).toBe(12);
    expect(result.minute).toBe(30);
  });

  it('should return a DateTime object in the specified timezone', () => {
    const time24h = '12:30';
    const zone = 'America/Los_Angeles';
    const weekday = 'Monday';

    const result = Meeting.makeFrom24h_That70sDateTime(time24h, zone, weekday);

    expect(result).toBeInstanceOf(DateTime);
    expect(result.zoneName).toBe('America/Los_Angeles');
  });

  it('should return a DateTime object in UTC if the "utc" parameter is true', () => {
    const time24h = '12:30';
    const zone = 'America/New_York';
    const weekday = 'Monday';
    const utc = true;

    const result = Meeting.makeFrom24h_That70sDateTime(time24h, zone, weekday, utc);

    expect(result).toBeInstanceOf(DateTime);
    expect(result.zoneName).toBe('UTC');
  });
});