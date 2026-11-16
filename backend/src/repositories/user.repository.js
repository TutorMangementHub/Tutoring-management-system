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

// TODO: add findAll, updateById, deleteById and any other queries a feature needs.
module.exports = {
    findById,
    findByEmail,
    create,
};
