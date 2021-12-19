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
                // Looking back in time, find when this observance last started.
                const lastStart = observance.rule.before(now);

                // The tiemzone with the most recent start date which is in the past is the current timezone
                if (lastStart && (!acc || lastStart > acc.start)) {
                    return { start: lastStart, observance: observance };
                }
                else {
                    return acc;
                }
            }, undefined).observance;

        return currentObservance.tzoffsetto;
    }

    localiseTime(caltime, tzid, when) {
        if (!tzid) {
            // Where there's no tzid, the caltime must be either a UTC time or a 'floating time'
            // We can't display floating times on discord, so we'll pretend it's a UTC time.
            return new Date(caltime.getUTCFullYear(), caltime.getUTCMonth(), caltime.getUTCDate(), caltime.getUTCHours(), caltime.getUTCMinutes(), caltime.getUTCSeconds(), caltime.getUTCMilliseconds());
        }

        const offset = this.findDaylightSavingOffset(tzid, when);
        const offsetSign = offset.substr(0, 1);
        const offsetHours = Number(offsetSign + offset.substr(1, 2));
        const offsetMins = Number(offsetSign + offset.substr(3, 2));

        return new Date(caltime.getFullYear(),
            caltime.getMonth(),
            caltime.getDate(),
            caltime.getHours() - +offsetHours,
            caltime.getMinutes() - +offsetMins,
            caltime.getSeconds(),
            caltime.getMilliseconds(),
        );
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
                event.start = this.timezones.localiseTime(event.start, event.start.tz, event.start);
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
            // Fetch all previous messages from channel. Put the messages in an array.
            // Filter out messages not sent by the bot. Reverse array to show them in order from oldest (0) to newest (1 or higher)
            const previous_messages = (await channel.messages.fetch()).map(message => message).filter(m => m?.author?.id === client?.user?.id).reverse();

            const existing_message = previous_messages.length > 0;

            // Use the newest message to edit
            const msg_to_edit = previous_messages.pop();

            for (const to_delete of previous_messages) {
                to_delete.delete();
            }

            if (!channel) {
                console.error(`Calendar: Couldn't get channel ${channelId}`);
                return;
            }

            channel.sendTyping();

            try {
                // Fetch Calendar
                const calResp = await axios.get(icsUrl);
                if (calResp.status !== 200) {
                    console.error(`Calendar: Failed to get calendar. Code: ${calResp.status} ics:${icsUrl}`);
                    return;
                }

                // Parse and Sort (Closest event first)
                // Only show the first 10 events
                const calendar = new Calendar(ical.parseICS(calResp.data));
                const events = calendar.eventsBetween(today, end)
                    .sort((e1, e2) => new Date(e1.start).getTime() - new Date(e2.start).getTime()).slice(0, 9);

                if (events.length <= 0) return;

                // Generate embeds
                const embeds = events.map(event => createEmbed(event, calendarUrl));

                // Send a message of none exist
                if (existing_message) {
                    msg_to_edit.edit({ embeds }).catch(err => {
                        console.error(err);
                        console.log(embeds);
                    });
                }
                else {
                    await channel.send({ embeds });
                }
            }
            catch (err) {
                console.error(err);
            }
        }

        // Run main script
        main();
        const loop = setInterval(main, autostart.interval);

        // Exit script after 24 hours for a restart
        setTimeout(() => clearInterval(loop), 86340000);
    },
};

function getRecurringEvents(vevent, startDate, endDate) {
    // For recurring events, we'll push a copy of the original event unless there's a
    // corresponding event with overridden details in event.recurrences
    const recurrenceEvents = [];

    const excludeDates = new Set(Object.values(vevent.exdate || [])
        // An array of Dates with a tz field.
        .map(date => date.getTime()));

    // The dates returned by the rrule will be in the local timezone.
    // We're working in UTC, so attach the local timezone so that they
    // can be converted to UTC along with everything else.
    // An array of Date()s without a tz field, but in the dtstart's timezone
    const recurrenceDates = new Set(vevent.rrule.between(startDate, endDate, true)
        .map(e => e.getTime())
        .filter(e => !excludeDates.has(e)));

    for (const event of Object.values(vevent.recurrences || [])) {
        const date = event.start.getTime();
        if (date >= startDate.getTime() && date <= endDate.getTime() && !excludeDates.has(date)) {
            recurrenceDates.delete(date);
            recurrenceEvents.push(event);
        }
    }

    recurrenceDates.forEach(d => {
        const recEvent = Object.assign({}, vevent);
        recEvent.start = fromRRuleDate(new Date(d), vevent.start.tz, vevent.start);
        recEvent.end = new Date(d + (new Date(vevent.end).getTime() - new Date(vevent.start).getTime()));
        recurrenceEvents.push(recEvent);
    });

    return recurrenceEvents;
}

function htmlToDiscordMarkdown(html) {
    let out = html;

    // Replace less than and greater than
    out = out.replace(/&lt;/g, '<');
    out = out.replace(/&gt;/g, '>');

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
        event.description = '‏';
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

// Embellish a Date from RRule with the extra data needed to handle timezone conversion
// inTzDate specified the Date in which this event's timezone was supposed to represent.
// ie, if the event was created during winter time, but the recurrence happens in summer, we need to
// offset the time accordingly.  This is due to a bug in the way the ical library creates RRules for events.
function fromRRuleDate(date, tz, inTzDate) {
    const newDate = date;
    if (inTzDate) {
        newDate.inTzDate = inTzDate;
    }
    newDate.tz = tz;
    return newDate;
}