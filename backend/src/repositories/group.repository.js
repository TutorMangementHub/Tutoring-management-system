const { Group } = require('../models');

function findAll(filter = {}) {
    return Group.find(filter).populate('gradeId', 'level').sort({ gradeId: 1, number: 1 }).lean();
}

function findPage({ filter = {}, page = 1, pageSize = 10 } = {}) {
    const skip = (page - 1) * pageSize;
    return Promise.all([
        Group.countDocuments(filter),
        Group.find(filter)
            .populate('gradeId', 'level')
            .sort({ gradeId: 1, number: 1, name: 1 })
            .skip(skip)
            .limit(pageSize)
            .lean(),
    ]).then(([total, groups]) => ({ groups, total, page, pageSize }));
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

module.exports = { findAll, findPage, findById, create, incrementStudentCount };
