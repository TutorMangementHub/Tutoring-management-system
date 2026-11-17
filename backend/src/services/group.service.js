const HttpError = require('../utils/http-error');
const groupRepository = require('../repositories/group.repository');
const gradeRepository = require('../repositories/grade.repository');

const DEFAULT_PAGE_SIZE = 8;

function listAvailable() {
    return groupRepository.findAll({ isActive: true });
}

function buildGroupFilter({ search, gradeId }) {
    const filter = {};
    if (search) {
        filter.name = {
            $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
            $options: 'i',
        };
    }
    if (gradeId) filter.gradeId = gradeId;
    return filter;
}

async function listGroupPage({ page, search, gradeId } = {}) {
    const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
    const currentSearch = String(search || '').trim();
    const currentGradeId = String(gradeId || '').trim();
    const filter = buildGroupFilter({ search: currentSearch, gradeId: currentGradeId });
    const [result, grades] = await Promise.all([
        groupRepository.findPage({ filter, page: currentPage, pageSize: DEFAULT_PAGE_SIZE }),
        gradeRepository.findAll(),
    ]);
    return { ...result, grades, search: currentSearch, gradeId: currentGradeId };
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

module.exports = { listAvailable, listGroupPage, createGroup, assertAssignable };
