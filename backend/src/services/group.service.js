const HttpError = require('../utils/http-error');
const groupRepository = require('../repositories/group.repository');
const gradeRepository = require('../repositories/grade.repository');

function listAvailable() {
    return groupRepository.findAll({ isActive: true });
}

async function createGroup(data) {
    const grade = await gradeRepository.findById(data.gradeId);
    if (!grade) {
        throw HttpError.badRequest('The selected grade does not exist');
    }
    return groupRepository.create(data);
}

async function assertAssignable(groupId, gradeId) {
    const group = await groupRepository.findById(groupId);
    if (!group || group.isActive === false) {
        throw HttpError.badRequest('The selected group is not available');
    }
    if (String(group.gradeId) !== String(gradeId)) {
        throw HttpError.badRequest('The selected group does not belong to the selected grade');
    }
    return group;
}

module.exports = { listAvailable, createGroup, assertAssignable };
