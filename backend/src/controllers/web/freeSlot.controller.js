const { createFreeSlotSchema, DAYS, formatMinutes } = require('../../schemas/freeSlot.schema');
const freeSlotService = require('../../services/freeSlot.service');
const authService = require('../../services/auth.service');

const EMPTY_VALUES = { dayOfWeek: '', start: '08:00', end: '09:00' };

async function renderSlots(response, {
    groupId,
    user,
    status = 200,
    error = null,
    values = EMPTY_VALUES,
}) {
    const { group, slotsByDay } = await freeSlotService.listForGroup(groupId);
    response.status(status).render('slots/index', {
        title: `Free time · ${group.name}`,
        group,
        slotsByDay,
        days: DAYS,
        formatTime: formatMinutes,
        teacher: await authService.getTeacherSummary(user.id),
        error,
        values: { ...EMPTY_VALUES, ...values },
    });
}

async function renderOrRedirect(response, options) {
    try {
        await renderSlots(response, options);
    } catch {
        response.redirect('/groups');
    }
}

async function slotsPage(request, response) {
    await renderOrRedirect(response, {
        groupId: request.params.groupId,
        user: request.user,
        error: request.query.error || null,
    });
}

async function create(request, response) {
    const { groupId } = request.params;
    const values = {
        dayOfWeek: request.body.dayOfWeek || '',
        start: request.body.start || EMPTY_VALUES.start,
        end: request.body.end || EMPTY_VALUES.end,
    };
    const parsed = createFreeSlotSchema.safeParse({
        dayOfWeek: request.body.dayOfWeek,
        start: request.body.start,
        end: request.body.end,
    });

    if (!parsed.success) {
        await renderOrRedirect(response, {
            groupId,
            user: request.user,
            status: 400,
            error: parsed.error.issues[0]?.message || 'Please check the form and try again.',
            values,
        });
        return;
    }

    try {
        await freeSlotService.addSlot(groupId, parsed.data);
        response.redirect(`/groups/${groupId}/slots`);
    } catch (error) {
        await renderOrRedirect(response, {
            groupId,
            user: request.user,
            status: error.status || 400,
            error: error.message || 'The free time slot could not be added.',
            values,
        });
    }
}

async function remove(request, response) {
    const { groupId, slotId } = request.params;

    try {
        await freeSlotService.removeSlot(groupId, slotId);
        response.redirect(`/groups/${groupId}/slots`);
    } catch (error) {
        response.redirect(
            `/groups/${groupId}/slots?error=${encodeURIComponent(error.message || 'The free time slot could not be removed.')}`,
        );
    }
}

module.exports = {
    slotsPage,
    create,
    remove,
};
