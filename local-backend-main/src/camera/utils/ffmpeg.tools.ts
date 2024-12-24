import { Timemark, VideoSegment } from '../types';

/**
 * Parses a time mark of the format "HH:MM:SS.SS".
 * @param timeMark - The time mark string to parse.
 * @returns An object containing hours, minutes, seconds, and milliseconds.
 */
export function parseTimeMark(timeMark: string): Timemark | null {
  // Regular expression to match the time mark
  const regex = /^(\d{2}):(\d{2}):(\d{2})\.(\d{2})$/;
  const match = timeMark.match(regex);

  if (!match) {
    return null;
  }

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);
  const milliseconds = parseInt(match[4], 10) * 10; // Convert hundredths of a second to milliseconds

  return {
    hours: hours,
    minutes: minutes,
    seconds: seconds,
    milliseconds: milliseconds,
  };
}

/**
 * Parses silence end log produced by ffmpeg in format of
 *
 * [silencedetect @ 000002ef899fcc80] silence_end: 8.39663 | silence_duration: 2.187
 *
 * @returns video segment produced by the silence log
 */
export function parseSilenceLog(log: string): VideoSegment | null {
  // TODO: Find a better way of doing this
  const regex =
    /(\[silencedetect @ .+\])\s?silence_end:\s?(\d+.\d+)\s?\|\s?silence_duration:\s?(\d+.\d+)/;
  const match = log.trim().match(regex);
  if (!match) return null;

  // First group is [silencedetect] entry part
  // second group is defined by first (\d+.\d+) and represents end time
  // third group is defined by second float parsing operation
  // and represents silence duration
  const end = +match?.at(2);
  const duration = +match?.at(3);

  if (isNaN(end) || isNaN(duration)) return null;

  return {
    start: end - duration,
    end,
  };
}

/**
 * Returns the inverse of segments of a video given the segments and video duration.
 * @returns {VideoSegment[]} An array of inversed segments.
 */
export function invertSegments(
  segments: VideoSegment[],
  videoDuration: Timemark,
): VideoSegment[] {
  const duration = getTimemarkInSeconds(videoDuration);

  const inverseSegments: VideoSegment[] = segments.reduce(
    (acc: VideoSegment[], segment, index, array) => {
      const previousEnd = index === 0 ? 0 : array[index - 1].end;
      if (segment.start > previousEnd) {
        acc.push({ start: previousEnd, end: segment.start });
      }
      if (index === array.length - 1 && segment.end < duration) {
        acc.push({ start: segment.end, end: duration });
      }
      return acc;
    },
    [],
  );

  return inverseSegments;
}

/**
 * Transforms a float number of seconds into a string format of [[hh:]mm:]ss[.xxx].
 * @example
 * const formattedTime = formatTime(3661.123);
 * console.log(formattedTime); // "01:01:01.123*
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const hoursStr = hours > 0 ? `${String(hours).padStart(2, '0')}:` : '';
  const minutesStr =
    hours > 0 || minutes > 0 ? `${String(minutes).padStart(2, '0')}:` : '';
  const secondsStr = `${String(Math.floor(secs)).padStart(2, '0')}`;
  const millisecondsStr =
    secs % 1 > 0
      ? `.${String(Math.round((secs % 1) * 1000)).padStart(3, '0')}`
      : '';

  return `${hoursStr}${minutesStr}${secondsStr}${millisecondsStr}`;
}

/**
 * Transforms a video timemark into a number of seconds
 */
export function getTimemarkInSeconds(timemark: Timemark) {
  return (
    (timemark.hours * 3600000 +
      timemark.minutes * 60000 +
      timemark.seconds * 1000 +
      timemark.milliseconds) /
    1000
  );
}

export function extendAndMergeSegments(
  segments: VideoSegment[],
  extensionTime: number,
): VideoSegment[] {
  // Extend each segment by the specified extension time before and after
  const extendedSegments = segments.map((segment) => ({
    start: Math.max(0, segment.start - extensionTime), // Ensure start is not negative
    end: segment.end + extensionTime,
  }));

  // Sort segments by start time
  extendedSegments.sort((a, b) => a.start - b.start);

  // Merge overlapping or adjacent segments
  const mergedSegments = [];
  for (const segment of extendedSegments) {
    if (
      mergedSegments.length > 0 &&
      mergedSegments[mergedSegments.length - 1].end >= segment.start
    ) {
      // Merge with the last segment
      mergedSegments[mergedSegments.length - 1].end = Math.max(
        mergedSegments[mergedSegments.length - 1].end,
        segment.end,
      );
    } else {
      // Add as a new segment
      mergedSegments.push(segment);
    }
  }

  return mergedSegments;
}
