const groupService = require('../../services/group.service');

async function list(_request, response) {
    response.json(await groupService.listAvailable());
}

async function create(request, response) {
    const group = await groupService.createGroup(request.validated.body);
    response.status(201).json(group);
}

async function listStudents(request, response) {
    const { group, students } = await groupService.listStudents(request.params.id);
    response.json({ group, students, studentCount: students.length });
}

async function removeStudent(request, response) {
    const result = await groupService.removeStudent(request.params.id, request.params.studentId);
    response.json({
        message: 'The student was removed from the group',
        group: result.group,
        student: result.student,
    });
}

module.exports = { list, create, listStudents, removeStudent };
