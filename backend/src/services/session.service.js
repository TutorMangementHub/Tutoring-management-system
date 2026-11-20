const HttpError = require('../utils/http-error');
const Session = require('../models/Session');
const sessionRepository = require('../repositories/session.repository');
const userRepository = require('../repositories/user.repository');

const DEFAULT_LIMIT = 5;

/** The group always comes from the logged-in user, never from the request. */
async function resolveStudentGroup(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
        throw HttpError.notFound('User not found');
    }
    if (!user.groupId) {
        throw HttpError.badRequest('You are not assigned to a group yet');
    }
    return user.groupId;
}

/** Turns "YYYY-MM-DD" into midnight UTC, or throws 400 for impossible dates. */
function parseDay(value) {
    const date = Session.toMidnightUTC(value);
    if (!(date instanceof Date)) {
        throw HttpError.badRequest(`"${value}" is not a valid date`);
    }
    return date;
}

/** Shape sent to the client: ready to display. */
function toDisplay(session) {
    return {
        id: session._id,
        title: session.title,
        sessionDate: session.sessionDate,
        startMin: session.startMin,
        endMin: session.endMin,
        groups: session.groupIds.map((group) => group.name),
    };
}

async function getStudentCalendar(userId, { from, to } = {}) {
    const groupId = await resolveStudentGroup(userId);

    const range = {};
    if (from) range.from = parseDay(from);
    if (to) range.to = parseDay(to);

    if (range.from && range.to && range.from > range.to) {
        throw HttpError.badRequest('"from" must be before or equal to "to"');
    }

    const sessions = await sessionRepository.findForGroup(groupId, range);
    return sessions.map(toDisplay);
}

async function getStudentUpcoming(userId, { limit = DEFAULT_LIMIT } = {}) {
    const groupId = await resolveStudentGroup(userId);

    const sessions = await sessionRepository.findUpcomingForGroup(groupId, {
        limit,
        from: Session.toMidnightUTC(new Date()),
    });
    return sessions.map(toDisplay);
}

module.exports = { getStudentCalendar, getStudentUpcoming };
