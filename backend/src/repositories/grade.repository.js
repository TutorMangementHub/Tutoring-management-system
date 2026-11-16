// TODO: implement the grade data access layer.
// Only repositories talk to Mongoose models.
const { Grade } = require('../models');

function findAll() {
    return Grade.find({}).sort({ level: 1 }).lean();
}

function findById(id) {
    return Grade.findById(id).lean();
}

module.exports = { findAll, findById };
