const { createGroupSchema } = require('../../schemas/group.schema');
const groupService = require('../../services/group.service');
const authService = require('../../services/auth.service');
const gradeService = require('../../services/grade.service');

async function teacherDetails(user) {
    return authService.getTeacherSummary(user.id);
}

async function indexPage(request, response) {
    const [groupPage, teacher] = await Promise.all([
        groupService.listGroupPage(request.query),
        teacherDetails(request.user),
    ]);
    response.render('groups/index', {
        title: 'Groups',
        groups: groupPage.groups,
        grades: groupPage.grades,
        page: groupPage.page,
        pageSize: groupPage.pageSize,
        total: groupPage.total,
        search: groupPage.search,
        gradeId: groupPage.gradeId,
        teacher,
    });
}

async function renderCreatePage(response, {
    grades,
    values = {},
    error = null,
    created = false,
    user,
    status = 200,
} = {}) {
    response.status(status).render('groups/create', {
        title: 'Create a group',
        grades: grades || await gradeService.listGrades(),
        values: {
            name: values.name || '',
            number: values.number || '',
            gradeId: values.gradeId || '',
        },
        error,
        created,
        user,
        teacher: await teacherDetails(user),
    });
}

async function createPage(request, response) {
    await renderCreatePage(response, {
        created: request.query.created === '1',
        user: request.user,
    });
}

async function create(request, response) {
    const result = createGroupSchema.safeParse({
        gradeId: request.body.gradeId,
        number: request.body.number === '' ? undefined : Number(request.body.number),
        name: request.body.name,
    });

    if (!result.success) {
        await renderCreatePage(response, {
            values: request.body,
            error: result.error.issues[0]?.message || 'Please check the form and try again.',
            user: request.user,
            status: 400,
        });
        return;
    }

    try {
        await groupService.createGroup(result.data);
        response.redirect('/groups/new?created=1');
    } catch (error) {
        await renderCreatePage(response, {
            values: request.body,
            error: error.message || 'The group could not be created.',
            user: request.user,
            status: error.status || 400,
        });
    }
}

module.exports = {
    indexPage,
    createPage,
    create,
};
