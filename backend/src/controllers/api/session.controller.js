const sessionService = require('../../services/session.service');

async function mine(request, response) {
    const sessions = await sessionService.getStudentCalendar(
        request.user.id,
        request.validated.query,
    );
    response.json(sessions);
}

async function upcoming(request, response) {
    const sessions = await sessionService.getStudentUpcoming(
        request.user.id,
        request.validated.query,
    );
    response.json(sessions);
}

module.exports = { mine, upcoming };
