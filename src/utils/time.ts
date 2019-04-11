import { Testing } from "../testing/testing";
import { Assert } from "./assert";

export namespace Time {
  const DAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  export enum Unit {
    SEC = 1000,
    MIN = 60 * SEC,
    HOUR = 60 * MIN,
    DAY = 24 * HOUR
  }

  export function formatTime(date: Date | number) {
    const d = new Date(date);
    let hours = d.getHours();
    let minutes = d.getMinutes();
    let ampm = hours >= 12 ? "pm" : "am";
    hours = hours > 12 ? hours - 12 : hours; // 12 hour clock
    hours = hours == 0 ? (hours = 12) : hours; // hour should be 12:15 am not 0:15 am
    return `${hours}:${zeroPad(minutes)}${ampm}`;
  }

  Testing.registerTest("format time", ctx => {
    const d = new Date(2019, 1, 4, 13, 14, 15, 16);
    ctx.assertEquals("1:14pm", formatTime(d), "");
    ctx.assertEquals("1:14pm", formatTime(new Date(d.getTime())), "");
  });

  export function formatDuration(millis: number, round: Unit) {
    let rest = millis;

    const days = Math.floor(rest / Unit.DAY);
    rest -= days * Unit.DAY;

    if (rest < round) {
      return `${days}d`;
    }

    const hours = Math.floor(rest / Unit.HOUR);
    rest -= hours * Unit.HOUR;

    if (rest < round) {
      return `${days > 0 ? days + "d " : ""}${hours > 0 ? hours + "h" : ""}` || "0d";
    }

    const mins = Math.floor(rest / Unit.MIN);
    rest -= mins * Unit.MIN;

    if (rest < round) {
      return `${days > 0 ? days + "d " : ""}${hours > 0 ? hours + "h " : ""}${mins > 0 ? mins + "m" : ""}` || "0m";
    }

    const secs = Math.floor(rest / Unit.SEC);
    return `${days > 0 ? days + "d " : ""}${hours > 0 ? hours + "h " : ""}${mins > 0 ? mins + "m " : ""}${secs > 0 ? secs + "s" : ""}` || "0s";
  }

  Testing.registerTest("format duration", ctx => {
    {
      let d = 2 * Unit.DAY + 7 * Unit.HOUR + 16 * Unit.MIN + 19 * Unit.SEC;
      ctx.assertEquals("2d", formatDuration(d, Unit.DAY));
      ctx.assertEquals("2d 7h", formatDuration(d, Unit.HOUR));
      ctx.assertEquals("2d 7h 16m", formatDuration(d, Unit.MIN));
      ctx.assertEquals("2d 7h 16m 19s", formatDuration(d, Unit.SEC));
    }
    {
      let d = 120 * Unit.MIN + 60 * Unit.SEC;
      ctx.assertEquals("2h 1m", formatDuration(d, Unit.MIN));
      ctx.assertEquals("2h 1m", formatDuration(d, Unit.SEC));
    }
    {
      let d = 48 * Unit.HOUR + 120 * Unit.MIN + 60 * Unit.SEC;
      ctx.assertEquals("2d 2h 1m", formatDuration(d, Unit.SEC));
    }
  });

  export function formatDurationHHMM(millis: number) {
    const isNegative = millis < 0;
    millis = Math.abs(millis);
    const s = Math.floor(millis / 1000);
    const m = Math.floor(s / 60);
    return (isNegative ? "-" : "") + zeroPad(m) + ":" + zeroPad(s % 60);
  }

  export function zeroPad(n: number) {
    return n < 10 ? "0" + n : "" + n;
  }

  export function getDayOfWeek(d: Date, longFormat: boolean) {
    if (longFormat) {
      return DAYS_LONG[d.getDay()];
    }
    return DAYS_SHORT[d.getDay()];
  }

  export function dateEq(d1: Date, d2: Date) {
    return toYYYYMMDD(d1) === toYYYYMMDD(d2);
  }

  /** Returns day of week or "today", "tomorrow", or "17 Jan" (if date too far away) */
  export function getDOWOrRelative(today: Date, d: Date, longFormat: boolean) {
    const todayYMD = toYYYYMMDD(today);
    const dateYMD = toYYYYMMDD(d);
    if (todayYMD === dateYMD) {
      return "Today";
    }
    if (toYYYYMMDD(new Date(today.getTime() + Unit.DAY)) === dateYMD) {
      return "Tomorrow";
    }
    if (daysBetween(today, d) < 7) {
      return getDayOfWeek(d, longFormat);
    }
    return `${d.getDate()} ${getMonth(d, longFormat)}`;
  }

  Testing.registerTest("dow or relative", ctx => {
    const today = new Date(2019, 1, 4, 12, 0, 0, 0);
    ctx.assertEquals("Today", getDOWOrRelative(today, new Date(2019, 1, 4, 0, 0, 0, 1), false), "01");
    ctx.assertEquals("Today", getDOWOrRelative(today, new Date(2019, 1, 4, 13, 10, 10, 10), false), "1010");
    ctx.assertEquals("Today", getDOWOrRelative(today, new Date(2019, 1, 4, 23, 59, 10, 10), false), "59");
    ctx.assertEquals("Tomorrow", getDOWOrRelative(today, new Date(2019, 1, 5, 0, 0, 0, 1), false), "01");
    ctx.assertEquals("Tomorrow", getDOWOrRelative(today, new Date(2019, 1, 5, 13, 10, 10, 10), false), "1010");
    ctx.assertEquals("Tomorrow", getDOWOrRelative(today, new Date(2019, 1, 5, 23, 59, 10, 10), false), "59");
    ctx.assertEquals("Wed", getDOWOrRelative(today, new Date(2019, 1, 6, 0, 0, 0, 1), false), "01");
    ctx.assertEquals("Wed", getDOWOrRelative(today, new Date(2019, 1, 6, 13, 10, 10, 10), false), "1010");
    ctx.assertEquals("Wed", getDOWOrRelative(today, new Date(2019, 1, 6, 23, 59, 10, 10), false), "59");
  });

  // Days between, ignoring time of day:
  export function daysBetween(d1: Date, d2: Date) {
    Assert.assert(d1, "d1");
    Assert.assert(d2, "d2");
    d1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), 12, 0, 0, 0);
    d2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate(), 12, 0, 0, 0);
    return Math.round(Math.abs((d2.getTime() - d1.getTime()) / Unit.DAY));
  }

  Testing.registerTest("days between", ctx => {
    ctx.assertEquals(0, daysBetween(new Date(2019, 0, 31, 0, 0, 0, 1), new Date(2019, 0, 31, 23, 59, 59, 1)));
    ctx.assertEquals(1, daysBetween(new Date(2019, 0, 31, 0, 10, 0, 1), new Date(2019, 1, 1, 23, 59, 59, 1)));
    ctx.assertEquals(364, daysBetween(new Date(2020, 0, 31, 0, 10, 0, 1), new Date(2019, 1, 1, 23, 59, 59, 1)));
  });

  export function getMonth(d: Date, longFormat: boolean) {
    if (longFormat) {
      return MONTHS_LONG[d.getMonth()];
    }
    return MONTHS_SHORT[d.getMonth()];
  }

  Testing.registerTest("day of week to string", ctx => {
    const d = new Date(2019, 1, 4, 12, 0, 0, 0);
    ctx.assertEquals(getDayOfWeek(d, true), "Monday", "");
    ctx.assertEquals(getDayOfWeek(new Date(d.getTime() + Unit.DAY), true), "Tuesday", "");
    ctx.assertEquals(getDayOfWeek(new Date(d.getTime() + 2 * Unit.DAY), true), "Wednesday", "");
    ctx.assertEquals(getDayOfWeek(new Date(d.getTime() + 3 * Unit.DAY), true), "Thursday", "");
    ctx.assertEquals(getDayOfWeek(new Date(d.getTime() + 4 * Unit.DAY), true), "Friday", "");
    ctx.assertEquals(getDayOfWeek(new Date(d.getTime() + 5 * Unit.DAY), true), "Saturday", "");
    ctx.assertEquals(getDayOfWeek(new Date(d.getTime() + 6 * Unit.DAY), true), "Sunday", "");
    ctx.assertEquals(getDayOfWeek(new Date(d.getTime() + 7 * Unit.DAY), true), "Monday", "");

    ctx.assertEquals(getMonth(d, true), "February", "");
    ctx.assertEquals(getMonth(d, false), "Feb", "");
  });
  Testing.registerTest("day of week", ctx => {
    const d = new Date();
    ctx.assert(getDayOfWeek(d, true) != getDayOfWeek(new Date(d.getTime() + Unit.DAY), true));
  });
  Testing.registerTest("date and month no errors", ctx => {
    const d = new Date(2019, 1, 4, 12, 0, 0, 0);
    for (let i = 0; i < 370; i++) {
      ctx.assert(getDayOfWeek(new Date(d.getTime() + Unit.DAY), true), `i=${i}`);
      ctx.assert(getDayOfWeek(new Date(d.getTime() + Unit.DAY), false), `i=${i}`);
      ctx.assert(getMonth(new Date(d.getTime() + Unit.DAY), true), `i=${i}`);
      ctx.assert(getMonth(new Date(d.getTime() + Unit.DAY), false), `i=${i}`);
    }
  });

  export function toYYYYMMDD(d: Date) {
    if (!d) {
      return 0;
    }
    return d.getFullYear() * 10000 + (1 + d.getMonth()) * 100 + d.getDate();
  }

  Testing.registerTest("yyyymmdd", ctx => {
    ctx.assertEquals(20100102, toYYYYMMDD(new Date(2010, 0, 2, 3, 4, 5)));
  });

  export function toYYYYMMDDHHMMSS(d: Date) {
    if (!d) {
      return 0;
    }
    return d.getFullYear() * 10000000000 + (1 + d.getMonth()) * 100000000 + d.getDate() * 1000000 + d.getHours() * 10000 + d.getMinutes() * 100 + d.getSeconds();
  }

  export function fromYYYYMMDDHHMMSS(d: number) {
    if (!d) {
      return undefined;
    }
    const s = d % 100;
    d = Math.floor(d / 100);
    const m = d % 100;
    d = Math.floor(d / 100);
    const h = d % 100;
    d = Math.floor(d / 100);
    const day = d % 100;
    d = Math.floor(d / 100);
    const month = d % 100;
    d = Math.floor(d / 100);
    const y = Math.floor(d);
    return newDate(y, month, day, h, m, s);
  }

  // New Date ignoring timezones
  export function newDate(y: number, month: number, date: number, h: number, m: number, s: number) {
    let res = new Date();
    res.setFullYear(y);
    res.setMonth(month - 1);
    res.setDate(date);
    res.setHours(h);
    res.setMinutes(m);
    res.setSeconds(s);
    res.setMilliseconds(0);
    return res;
  }

  Testing.registerTest("hours ignore timezone", ctx => {
    const d = new Date();
    const d2 = fromYYYYMMDDHHMMSS(toYYYYMMDDHHMMSS(d));
    ctx.assertEquals(d.getHours(), d2.getHours(), "hours");
  });

  Testing.registerTest("testing date yyyymmddhhmmss conversions", ctx => {
    const original = newDate(2010, 1, 2, 3, 4, 5);
    const ymd = toYYYYMMDDHHMMSS(original);
    ctx.assert(ymd == 20100102030405, "ymdhms invalid: " + ymd);
    const d = fromYYYYMMDDHHMMSS(ymd);
    ctx.assertEquals(2010, d.getFullYear(), "y");
    ctx.assertEquals(1 - 1, d.getMonth(), "m");
    ctx.assertEquals(2, d.getDate(), "d");
    ctx.assertEquals(3, d.getHours(), "h");
    ctx.assertEquals(4, d.getMinutes(), "min");
    ctx.assertEquals(5, d.getSeconds(), "sec");
    ctx.assertEquals(0, d.getMilliseconds(), "millis");
  });
}
