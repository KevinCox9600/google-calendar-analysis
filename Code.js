/**
 * Collect and analyze google calendar activities, then send email to self.
 */
function main() {
  const eventsInRange = getEvents();
  const eventsByColor = getEventsByColor(eventsInRange);
  const eventsByActivityType = getEventsByActivityType(eventsByColor);
  const summary = getSummary(eventsByActivityType);

  GmailApp.sendEmail(recipient, "Daily GCal Update", generateSummaryText(summary));
}

function generateSummaryText(summary) {
  let text = `Yesterday, you spent the following amount of time on the following activities:\n\n`;
  let bullets = "";
  for (let category in summary) {
    let info = summary[category];
    let eventNameText = info.events.reduce(
      (string, event) => `${string + event.getSummary()} - ${event.duration}, `, ""
    );
    bullets +=
      `- <b>${category}</b> (${info.totalHours}):\n`
      + `    - events: ${eventNameText}\n`;
  }
  return text + bullets;
}

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

function getEventsByColor(events) {
  // make dict to convert from color to color name
  const defaultColor = calendar.getColor();
  const eventColors = CalendarApp.EventColor;
  delete eventColors.toString;
  const colorOptions = { ...swap(eventColors) };
  colorOptions[defaultColor] = "BROWN";

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

function swap(json) {
  var ret = {};
  for (var key in json) {
    ret[json[key]] = key;
  }
  return ret;
}

function getEventsByActivityType(eventsByColor) {
  return Object.keys(eventsByColor).reduce((newObj, color) => {
    const newKey = COLOR_TO_ACTIVITY_TYPE[color] || "other";
    newObj[newKey] = eventsByColor[color];
    return newObj;
  }, {});
}

function getSummary(eventsByActivityType) {
  let summary = {};
  for (let activityType in eventsByActivityType) {
    const events = eventsByActivityType[activityType];
    events.sort((a, b) => b.duration - a.duration);
    summary[activityType] = {
      totalHours: events.reduce((totalHours, event) => totalHours + event.duration, 0),
      eventNames: events.map(event => event.getSummary()),
      events,
    };
  }

  return summary;
};;;;
