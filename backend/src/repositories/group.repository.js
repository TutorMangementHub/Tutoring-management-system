const { Group } = require('../models');

function findAll(filter = {}) {
    return Group.find(filter).populate('gradeId', 'level').sort({ gradeId: 1, number: 1 }).lean();
}

function findById(id) {
    return Group.findById(id).lean();
}

async function create(data) {
    const group = await Group.create(data);
    await group.populate('gradeId', 'level');
    return group.toObject();
}

function incrementStudentCount(id, delta) {
    return Group.updateOne({ _id: id }, { $inc: { studentCount: delta } });
}

module.exports = { findAll, findById, create, incrementStudentCount };
