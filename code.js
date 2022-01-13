const COLOR_TO_ACTIVITY_TYPE = {
    BLUE: "work",
    BROWN: "default",
    CYAN: "social",
    GREEN: "productive",
    ORANGE: "waste of time",
    PALE_GREEN: "exercise",
    PALE_RED: "class",
    // additional colors: gray, mauve, pale blue, red, yellow
};

function main() {
    const eventsInRange = getEvents();
    const eventsByColor = getEventsByColor(eventsInRange);
    const eventsByActivityType = getEventsByActivityType(eventsByColor);
    const summary = getSummary(eventsByActivityType);

    console.log(summary);
}

function getEvents() {
    calendar = CalendarApp.getDefaultCalendar();

    // get dates
    let today5am = new Date();
    today5am.setHours(5, 0, 0, 0);
    let yesterday5am = new Date(today5am.getTime() - 24 * 60 * 60 * 1000);

    // get events
    const events = calendar.getEvents(yesterday5am, today5am);
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
    summary = {};
    for (let activityType in eventsByActivityType) {
        events = eventsByActivityType[activityType];
        eventDuration = event => (event.getEndTime() - event.getStartTime()) / (3600 * 1000);
        summary[activityType] = {
            totalHours: events.reduce((totalHours, event) => totalHours + eventDuration(event), 0),
            eventNames: events.map(event => event.getSummary()),
        };
    }

    return summary;
}