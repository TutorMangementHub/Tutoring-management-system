const { FreeSlot } = require('../models');

function findByGroup(groupId) {
    return FreeSlot.find({ groupId }).sort({ dayOfWeek: 1, startMin: 1 }).lean();
}

function findById(slotId) {
    return FreeSlot.findById(slotId).lean();
}

function create(data) {
    return FreeSlot.create(data);
}

/** Scoped by both ids so a slot can never be removed through another group. */
function removeOne(groupId, slotId) {
    return FreeSlot.findOneAndDelete({ _id: slotId, groupId }).lean();
}

function removeAllForGroup(groupId) {
    return FreeSlot.deleteMany({ groupId });
}

module.exports = {
    findByGroup,
    findById,
    create,
    removeOne,
    removeAllForGroup,
};
