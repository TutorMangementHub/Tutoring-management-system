const HttpError = require('../utils/http-error');
const groupRepository = require('../repositories/group.repository');

function listAvailable() {
    return groupRepository.findAll({ isActive: true });
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

module.exports = { listAvailable, assertAssignable };
