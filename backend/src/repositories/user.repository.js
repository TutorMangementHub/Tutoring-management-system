const { User } = require('../models');

/** Data access for the `users` collection. */

function findById(id, { includePassword = false } = {}) {
    const query = User.findById(id);
    if (includePassword) {
        query.select('+passwordHash');
    }
    return query.lean();
}

function findByEmail(email, { includePassword = false } = {}) {
    const query = User.findOne({ email: String(email).toLowerCase().trim() });
    if (includePassword) {
        query.select('+passwordHash');
    }
    return query.lean();
}

function create(data) {
    return User.create(data);
}

function findAll(filter = {}, { sort = { fullName: 1 } } = {}) {
    return User.find(filter).sort(sort).lean();
}

/** Detach a student from their group, returning the updated document. */
function clearGroupById(id) {
    return User.findOneAndUpdate(
        { _id: id, role: 'STUDENT' },
        { $set: { groupId: null } },
        { new: true },
    ).lean();
}

function count(filter = {}) {
    return User.countDocuments(filter);
}

module.exports = {
    findById,
    findByEmail,
    create,
    findAll,
    clearGroupById,
    count,
};
