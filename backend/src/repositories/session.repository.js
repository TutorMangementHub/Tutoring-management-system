const { Session } = require('../models');

/** Data access for the `sessions` collection. No business rules here. */

function findForGroup(groupId, { from, to } = {}) {
    const filter = { groupIds: groupId };
    if (from || to) {
        filter.sessionDate = {};
        if (from) filter.sessionDate.$gte = from;
        if (to) filter.sessionDate.$lte = to;
    }
    return Session.find(filter)
        .populate('groupIds', 'name')
        .sort({ sessionDate: 1, startMin: 1 })
        .lean();
}

function findUpcomingForGroup(groupId, { limit = 5, from = new Date() } = {}) {
    return Session.find({ groupIds: groupId, sessionDate: { $gte: from } })
        .populate('groupIds', 'name')
        .sort({ sessionDate: 1, startMin: 1 })
        .limit(limit)
        .lean();
}

module.exports = { findForGroup, findUpcomingForGroup };
