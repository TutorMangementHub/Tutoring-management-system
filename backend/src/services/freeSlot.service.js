const HttpError = require('../utils/http-error');
const freeSlotRepository = require('../repositories/freeSlot.repository');
const groupRepository = require('../repositories/group.repository');
const gradeRepository = require('../repositories/grade.repository');
const {
    DAYS,
    createFreeSlotSchema,
    toMinutes,
    formatMinutes,
} = require('../schemas/freeSlot.schema');

const MAX_SLOTS_PER_DAY = 8;

function isCastError(error) {
    return error?.name === 'CastError';
}

async function getGroupOrThrow(groupId) {
    let group;
    try {
        group = await groupRepository.findById(groupId);
    } catch (error) {
        if (isCastError(error)) {
            throw HttpError.notFound('The group was not found');
        }
        throw error;
    }

    if (!group) {
        throw HttpError.notFound('The group was not found');
    }
    return group;
}

async function findGradeLevel(group) {
    if (!group.gradeId) {
        return 'Grade';
    }

    try {
        const grade = await gradeRepository.findById(group.gradeId);
        return grade?.level || 'Grade';
    } catch {
        return 'Grade';
    }
}

function emptyWeek() {
    return DAYS.reduce((week, day) => {
        week[day] = [];
        return week;
    }, {});
}

async function listForGroup(groupId) {
    const group = await getGroupOrThrow(groupId);
    const [slots, gradeLevel] = await Promise.all([
        freeSlotRepository.findByGroup(group._id),
        findGradeLevel(group),
    ]);

    const slotsByDay = emptyWeek();
    for (const slot of slots) {
        if (slotsByDay[slot.dayOfWeek]) {
            slotsByDay[slot.dayOfWeek].push(slot);
        }
    }
    for (const day of DAYS) {
        slotsByDay[day].sort((first, second) => first.startMin - second.startMin);
    }

    return { group: { ...group, gradeLevel }, slotsByDay };
}

async function addSlot(groupId, data) {
    const parsed = createFreeSlotSchema.safeParse(data);
    if (!parsed.success) {
        throw HttpError.badRequest(
            parsed.error.issues[0]?.message || 'Please check the slot details and try again.',
        );
    }

    const { dayOfWeek, start, end } = parsed.data;
    const startMin = toMinutes(start);
    const endMin = toMinutes(end);

    await getGroupOrThrow(groupId);

    const existing = await freeSlotRepository.findByGroup(groupId);
    const daySlots = existing.filter((slot) => slot.dayOfWeek === dayOfWeek);

    const duplicate = daySlots.find(
        (slot) => slot.startMin === startMin && slot.endMin === endMin,
    );
    if (duplicate) {
        throw HttpError.conflict('This free time slot already exists for this group');
    }

    if (daySlots.length >= MAX_SLOTS_PER_DAY) {
        throw HttpError.badRequest(
            `A day can have at most ${MAX_SLOTS_PER_DAY} free time slots`,
        );
    }

    const overlap = daySlots.find(
        (slot) => startMin < slot.endMin && slot.startMin < endMin,
    );
    if (overlap) {
        throw HttpError.badRequest(
            `This slot overlaps the existing ${formatMinutes(overlap.startMin)} - ${formatMinutes(overlap.endMin)} slot`,
        );
    }

    try {
        const slot = await freeSlotRepository.create({
            groupId,
            dayOfWeek,
            startMin,
            endMin,
        });
        return slot?.toObject ? slot.toObject() : slot;
    } catch (error) {
        if (error?.code === 11000) {
            throw HttpError.conflict('This free time slot already exists for this group');
        }
        if (error?.name === 'ValidationError') {
            const message = Object.values(error.errors || {})[0]?.message;
            throw HttpError.badRequest(message || 'The free time slot is invalid');
        }
        throw error;
    }
}

async function removeSlot(groupId, slotId) {
    let removed;
    try {
        removed = await freeSlotRepository.removeOne(groupId, slotId);
    } catch (error) {
        if (isCastError(error)) {
            throw HttpError.notFound('The free time slot was not found');
        }
        throw error;
    }

    if (!removed) {
        throw HttpError.notFound('The free time slot was not found');
    }
    return removed;
}

module.exports = {
    MAX_SLOTS_PER_DAY,
    listForGroup,
    addSlot,
    removeSlot,
};
