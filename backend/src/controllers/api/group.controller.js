const groupService = require('../../services/group.service');

async function list(_request, response) {
    response.json(await groupService.listAvailable());
}

async function create(request, response) {
    const group = await groupService.createGroup(request.validated.body);
    response.status(201).json(group);
}

module.exports = { list, create };
