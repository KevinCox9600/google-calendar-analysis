/**
 * Collect and analyze google calendar activities, then send email to self.
 */
function main() {
  const eventsInRange = getEvents();
  const eventsByColor = getEventsByColor(eventsInRange);
  const eventsByActivityType = getEventsByActivityType(eventsByColor);
  const summary = getSummary(eventsByActivityType);

  // console.log(generateSummaryText(summary));
  GmailApp.sendEmail(recipient, "Daily GCal Update", generateSummaryText(summary));
}

/**
 * Generate an overview of google calendar data in the following format:
 * 
 * Intro:
 * 
 * - Category (total duration)
 *     - events: event 1 - duration, event 2 - duration, ...
 * - Category (total duration)
 *     - events: event 1 - duration, event 2 - duration, ...
 * 
 * Inputs:
 * - summary: Array of activity objects
 * 
 * Returns: A string representing email plain text
 */
function generateSummaryText(summary) {
  let text = `Yesterday, you spent the following amount of time on the following activities:\n\n`;
  let bullets = "";
  for (let i in summary) {
    let info = summary[i];
    let eventNameText = info.events.reduce(
      (string, event) => `${string + event.getSummary()} - ${event.duration}, `, ""
    ).slice(0, -2);
    bullets +=
      `- ${info.activityType} (${info.totalHours}):\n`
      + `    - events: ${eventNameText}\n`;
  }
  return text + bullets;
}

/**
 * Get the calendar events between yesterday at 5am and today at 5am
 * 
 * Excludes all day events and adds duration field to events
 */
function getEvents() {
  calendar = CalendarApp.getDefaultCalendar();

  // get dates
  let today5am = new Date();
  today5am.setHours(5, 0, 0, 0);
  let yesterday5am = new Date(today5am.getTime() - 24 * 60 * 60 * 1000);

  // get events that aren't all day events, adding duration field
  let events = calendar.getEvents(yesterday5am, today5am);
  events = events.filter(event => !event.isAllDayEvent());
  events = events.map(event => {
    return { duration: (event.getEndTime() - event.getStartTime()) / (3600 * 1000), ...event };
  });
  console.log("num events", events.length);

  return events;
}

/**
 * Gathers events by color, returning an object mapping color to events list
 */
function getEventsByColor(events) {
  // make dict to convert from color to color name
  const defaultColor = calendar.getColor();
  const eventColors = CalendarApp.EventColor;
  delete eventColors.toString;
  const colorOptions = { ...swap(eventColors) };
  colorOptions[defaultColor] = "DEFAULT";

  // make dict of color to events
  const eventsByColor = {};
  for (let event of events) {
    let color = colorOptions[event.getColor() || defaultColor] || "no color found";
    if (eventsByColor[color] === undefined) {
      eventsByColor[color] = [event];
    } else {
      eventsByColor[color].push(event);
    }
  }
  return eventsByColor;
}

/**
 * Swaps keys and values in an object
 */
function swap(json) {
  var ret = {};
  for (var key in json) {
    ret[json[key]] = key;
  }
  return ret;
}

/**
 * Converts events by color into events by activity type
 * 
 * Note:
 *  - Modify COLOR_TO_ACTIVITY_TYPE to personalize color coding key
 */
function getEventsByActivityType(eventsByColor) {
  return Object.keys(eventsByColor).reduce((newObj, color) => {
    const newKey = COLOR_TO_ACTIVITY_TYPE[color] || "other";
    newObj[newKey] = eventsByColor[color];
    return newObj;
  }, {});
}

/**
 * Return an object mapping activity type to an object containing summary statistics
 * 
 * Inputs:
 * - eventsByActivityType: Object mapping activity type to event objects 
 * 
 * Returns: Sorted array of activity objects
 */
function getSummary(eventsByActivityType) {
  let summary = [];
  // for (let activityType in eventsByActivityType) {
  let keys = Object.keys(eventsByActivityType);
  for (let i = 0; i < keys.length; i++) {
    let activityType = keys[i];
    const events = eventsByActivityType[activityType];
    events.sort((a, b) => b.duration - a.duration);
    summary[i] = {
      activityType,
      totalHours: events.reduce((totalHours, event) => totalHours + event.duration, 0),
      eventNames: events.map(event => event.getSummary()),
      events,
    };
  }
  summary = summary.sort((a, b) => b.totalHours - a.totalHours);

  return summary;
}
