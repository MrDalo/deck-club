const DAY_MS = 24 * 60 * 60 * 1000;

/** The study day containing an instant: from `start` (inclusive) to `end` (exclusive). */
export type StudyDay = {
  start: Date;
  end: Date;
  /** `YYYY-MM-DD` of the calendar date the study day starts on. */
  key: string;
};

/**
 * The study day an instant falls in. A day starts at `dayStartHour` rather
 * than midnight, so late-night study counts for the right day (spec 6). UTC
 * until profiles carry a time zone.
 * @param instant - any moment
 * @param dayStartHour - hour 0–23 at which a new study day begins
 * @returns the study day
 */
export function studyDayOf(instant: Date, dayStartHour: number): StudyDay {
  const start = new Date(instant);
  start.setUTCHours(dayStartHour, 0, 0, 0);
  if (start.getTime() > instant.getTime()) start.setTime(start.getTime() - DAY_MS);
  return {
    start,
    end: new Date(start.getTime() + DAY_MS),
    key: start.toISOString().slice(0, 10),
  };
}

/**
 * Consecutive study days with at least one review, counting back from today.
 * A day not yet studied today does not break the streak (spec 6: streak).
 * @param reviewedAt - when each review happened
 * @param now - the current time
 * @param dayStartHour - hour at which a study day begins
 * @returns the streak length in days
 */
export function streakDays(reviewedAt: readonly Date[], now: Date, dayStartHour: number): number {
  const studiedKeys = new Set(reviewedAt.map((moment) => studyDayOf(moment, dayStartHour).key));
  let cursor = studyDayOf(now, dayStartHour);
  if (!studiedKeys.has(cursor.key)) {
    cursor = studyDayOf(new Date(cursor.start.getTime() - 1), dayStartHour);
  }
  let streak = 0;
  while (studiedKeys.has(cursor.key)) {
    streak += 1;
    cursor = studyDayOf(new Date(cursor.start.getTime() - 1), dayStartHour);
  }
  return streak;
}
