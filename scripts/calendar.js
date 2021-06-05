const ical = require('ical');
const RRule = require('rrule').RRule;
const axios = require('axios');
const Discord = require('discord.js');

const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const weekDayColors = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'LUMINOUS_VIVID_PINK', 'ORANGE'];

function isBetween(date, start, end) {
    return date > start && date < end;
}

// CalandarTimeZoneManager parses and caches the timezone
// information included in an ical.
// You can then query it to resolve calendar dates/times into UTC
// Calendar datetimes may include a 'tz' field which specifies the tzid
// of the timezone that the datetime is in.
class CalendarTimeZoneManager {
    constructor(cal) {
        this.cal = cal;

        // Create TZID to timezone component map
        const vTimezones = Object.values(this.cal)
            .filter(v => v.type === 'VTIMEZONE') // Get VTIMEZONE components

            // Add Daylight saving rules to each timezone.
            .map(timezone => {
                timezone.observances = Object.values(timezone)
                    .filter(component => component.type === 'STANDARD' || component.type === 'DAYLIGHT')
                    .map(observance => {
                        const ruleOptions = RRule.parseString(observance.rrule);
                        ruleOptions.dtstart = observance.start;
                        observance.rule = new RRule(ruleOptions);
                        return observance;
                    });
                return timezone;
            })

            // Pair up the TZID with the timezone object.
            .map(v => [v.tzid, v]);

        this.timezones = new Map(vTimezones);
    }

    findDaylightSavingOffset(tzid, when) {
        const timezone = this.timezones.get(tzid);
        if (!timezone) {
            console.error(`Calendar: Failed to localise time in a calendar timezone. Calendar doesn't include timezone info for ${tzid}`);
            return;
        }

        // Find the current Daylight Savings observance
        let now = new Date();
        if (when) {
            now = when;
        }
        else {
            now = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
        }

        // Reduce all observances until we find the single one that we're currently in.
        const currentObservance =
            timezone.observances.reduce((acc, observance) => {
                const end = observance.rule.after(now);

                if (end && (!acc || end < acc.end)) {
                    return { end: end, observance: observance };
                }
                else {
                    return acc;
                }
            }, undefined).observance;

        return currentObservance.tzoffsetto;
    }

    localiseTime(caltime, tzid, when) {
        if (!tzid) {
            return caltime;
        }

        const offset = this.findDaylightSavingOffset(tzid, when);

        return new Date(caltime.toUTCString() + offset);
    }
}

class Calendar {
    constructor(cal) {
        this.cal = cal;
        this.timezones = new CalendarTimeZoneManager(cal);
    }


    eventsBetween(start, end) {
        let outEvents = [];

        const vEvents = Object.values(this.cal)
            .filter(v => v.type === 'VEVENT');

        const oneOffEvents = vEvents.filter(event => !event.rrule && isBetween(this.timezones.localiseTime(event.start, event.start.tz), start, end));
        outEvents = outEvents.concat(oneOffEvents);

        // Add events from recurring events.
        vEvents
            .filter(event => event.rrule)
            .forEach(event => outEvents = outEvents.concat(getRecurringEvents(event, start, end)));

        outEvents
            .map(event => {
                event.start = this.timezones.localiseTime(event.start, event.start.tz, event.start.inTzDate);
                return event;
            });


        return outEvents;
    }
}

module.exports = {
    name: 'calendar',
    async execute(autostart, client) {
        // args:
        // channel_id - string Id of the channel to post into
        // ics - string url of the calendar's ics
        // calendar_link - optional string url to the calendar
        // events_window - How many days ahead should we show events for
        async function main() {
            const channelId = autostart.args[0].channel_id;
            const icsUrl = autostart.args[0].ics;
            const calendarUrl = autostart.args[0].calendar_url;
            const eventsWindow = autostart.args[0].events_window || 7;

            const channel = await client.channels.fetch(channelId);
            const today = startOfDay(new Date());
            const end = new Date(today.getTime() + eventsWindow * 24 * 60 * 60 * 1000);

            if (!channel) {
                console.error(`Calendar: Couldn't get channel ${channelId}`);
                return;
            }

            channel.startTyping();

            try {
                // Fetch Calendar
                const calResp = await axios.get(icsUrl);
                if (calResp.status !== 200) {
                    console.error(`Calendar: Failed to get calendar. Code: ${calResp.status} ics:${icsUrl}`);
                    return;
                }

                // Parse and Sort (Closest event first)
                const calendar = new Calendar(ical.parseICS(calResp.data));
                const events = calendar.eventsBetween(today, end)
                    .sort((e1, e2) => new Date(e1.end).getTime() - new Date(e2.start).getTime());

                // Clear old Messages
                await clearChannel(client, channelId);

                // Send Event Messages
                events.forEach(event => {
                    const embed = createEmbed(event, calendarUrl);
                    channel.send(embed).catch(err => {
                        console.error(err);
                        console.log(embed);
                    });
                });
            }
            finally {
                channel.stopTyping();
            }
        }

        // Run main script
        main();
        const loop = setInterval(main, autostart.interval);

        // Exit script after 24 hours for a restart
        setTimeout(() => clearInterval(loop), 86400000);
    },
};

function getRecurringEvents(vevent, startDate, endDate) {
    // For recurring events, we'll push a copy of the original event unless there's a
    // corresponding event with overridden details in event.recurrences
    const recurrenceEvents = [];

    const excludeDates = new Set(Object.values(vevent.exdate || [])
        // An array of Dates with a tz field.
        .map(date => DateTimeInTZ(date, date.tz)));

    // The dates returned by the rrule will be in the local timezone.
    // We're working in UTC, so attach the local timezone so that they
    // can be converted to UTC along with everything else.
    // An array of Date()s without a tz field, but in the dtstart's timezone
    const recurrenceDates = new Set(vevent.rrule.between(startDate, endDate, true)
        .map(date => fromRRuleDate(date, vevent.start.tz, vevent.start))
        .filter(e => !excludeDates.has(e)));

    for (const [d, event] of Object.entries(vevent.recurrences || [])) {
        const date = new Date(d);
        if (date >= startDate && date <= endDate && !excludeDates.has(d)) {
            recurrenceDates.delete(d);
            recurrenceEvents.push(event);
        }
    }

    recurrenceDates.forEach(d => {
        const recEvent = Object.assign({}, vevent);
        recEvent.start = d;
        recEvent.end = new Date(d + (new Date(vevent.end).getTime() - new Date(vevent.start).getTime()));
        recurrenceEvents.push(recEvent);
    });

    return recurrenceEvents;
}

function htmlToDiscordMarkdown(html) {
    let out = html;

    // HTML entities that google calendar seems to like to add.
    out = out.replace(/&nbsp;/, ' ');

    // <br> and </br> tags into line breaks
    out = out.replace(/<\/?br\s?\/?>/g, '\n');

    // bold
    out = out.replace(/<\/?(b|strong)>/g, '**');

    // Italics
    out = out.replace(/<\/?i>/g, '*');

    // Underline
    out = out.replace(/<\/?(u)>/g, '__');

    // Bullet Points
    out = out.replace(/<ul>(.*?)<\/ul>/g, (m, p1) => {
        return p1.replace(/<li>(.*?)<\/li>/g, '- $1\n');
    });

    // Numbered lists
    out = out.replace(/<ol>(.*?)<\/ol>/gs, (olmatch, innerol) => {
        let num = 1;
        return innerol.replace(/<li>(.*?)<\/li>/gs,
            (limatch, innerli) => num++ + '. ' + innerli + '\n');
    });

    // Links
    out = out.replace(/<a (?:href="(.*)")?\/?>(.*)<\/a>/g, '[$2]($1)');

    // Remove <span>
    out = out.replace(/<\/?span>/g, '');

    return out;
}

function formatTime(date) {
    return ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2);
}

function createEmbed(event, url) {
    const date = event.start;

    // It seems either discord or discord.js won't accept
    // empty name or values in it's embed fields
    if (!event.summary) {
        event.summary = 'Untitled';
    }
    if (!event.description) {
        event.description = '‏‏‎ ';
    }

    return new Discord.MessageEmbed()
        .setTitle(weekDays[date.getDay()] + ' ' + formatTime(date) + ' UTC')
        .addField(event.summary, htmlToDiscordMarkdown(event.description))
        .setColor(weekDayColors[date.getDay()])
        .setURL(url)
        .setTimestamp(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()));
}

function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Deletes all messages in a channel.
async function clearChannel(client, channelID) {
    const channel = await client.channels.fetch(channelID);

    // NB: Will fail if there's any messages older than 2 weeks.
    const messages = (await channel.messages.fetch({ limit: 100 }));
    const toDelete = messages.filter(m => m.author.id == client.user.id);
    for (const msg of toDelete) {
        msg[1].delete();
    }
}

// iCal provides start and end date as JS Date objects
// with an additional 'tz' field containing the date's
// timezone.
// This function converts that to UTC and returns a new Date object
function DateTimeInTZ(date, tz) {
    date.tz = tz;
    return date;
}

// Embellish a Date from RRule with the extra data needed to handle timezone conversion
// inTzDate specified the Date in which this event's timezone was supposed to represent.
// ie, if the event was created during winter time, but the recurrence happens in summer, we need to
// offset the time accordingly.  This is due to a bug in the way the ical library creates RRules for events.
function fromRRuleDate(date, tz, inTzDate) {
    const newDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
        date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
    if (inTzDate) {
        newDate.inTzDate = inTzDate;
    }
    newDate.tz = tz;
    return newDate;
}