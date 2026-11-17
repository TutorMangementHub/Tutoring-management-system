const { createGroupSchema } = require('../../schemas/group.schema');
const gradeRepository = require('../../repositories/grade.repository');
const groupService = require('../../services/group.service');
const groupRepository = require('../../repositories/group.repository');
const authService = require('../../services/auth.service');

async function teacherDetails(user) {
    const profile = await authService.getProfile(user.id);
    return {
        name: profile.fullName || 'Teacher',
        email: profile.email || user.email || '',
    };
}

async function indexPage(request, response) {
    const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
    const pageSize = 8;
    const search = String(request.query.search || '').trim();
    const gradeId = String(request.query.gradeId || '').trim();
    const filter = {};
    if (search) filter.name = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    if (gradeId) filter.gradeId = gradeId;

    const [result, grades, teacher] = await Promise.all([
        groupRepository.findPage({ filter, page, pageSize }),
        gradeRepository.findAll(),
        teacherDetails(request.user),
    ]);
    response.render('groups/index', {
        title: 'Groups',
        groups: result.groups,
        grades,
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        search,
        gradeId,
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
        grades: grades || await gradeRepository.findAll(),
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
