const groupService = require('../../services/group.service');

async function list(_request, response) {
    response.json(await groupService.listAvailable());
}

module.exports = { list };
