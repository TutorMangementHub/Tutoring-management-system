const HttpError = require('../utils/http-error');
const groupRepository = require('../repositories/group.repository');
const gradeRepository = require('../repositories/grade.repository');
const userRepository = require('../repositories/user.repository');

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

async function getGroupOrThrow(groupId) {
    const group = await groupRepository.findById(groupId);
    if (!group) {
        throw HttpError.notFound('The group was not found');
    }
    return group;
}

/** Students currently enrolled in the given group. */
async function listStudents(groupId) {
    const group = await getGroupOrThrow(groupId);
    const students = await userRepository.findAll({ groupId: group._id, role: 'STUDENT' });
    return { group, students };
}

/** Remove a student who joined a group by mistake and keep the roster count in sync. */
async function removeStudent(groupId, studentId) {
    const group = await getGroupOrThrow(groupId);

    const student = await userRepository.findById(studentId);
    if (!student || student.role !== 'STUDENT' || String(student.groupId) !== String(group._id)) {
        throw HttpError.notFound('The student is not enrolled in this group');
    }

    const removed = await userRepository.clearGroupById(student._id);
    if (!removed) {
        throw HttpError.conflict('The student could not be removed from the group');
    }

    if (group.studentCount > 0) {
        await groupRepository.incrementStudentCount(group._id, -1);
    }

    return { group: await groupRepository.findById(group._id), student: removed };
}

/** Delete a group that is not used by any student. */
async function deleteGroup(groupId) {
    const group = await getGroupOrThrow(groupId);

    const enrolledCount = await userRepository.count({ groupId: group._id, role: 'STUDENT' });
    if (enrolledCount > 0) {
        throw HttpError.conflict('This group still has enrolled students and cannot be deleted');
    }

    const deleted = await groupRepository.deleteById(group._id);
    if (!deleted) {
        throw HttpError.conflict('The group could not be deleted');
    }

    return deleted;
}

module.exports = { listAvailable, listGroupPage, createGroup, assertAssignable, listStudents, removeStudent, deleteGroup };
