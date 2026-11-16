const gradeRepository = require('../../repositories/grade.repository');

async function list(_request, response) {
    response.json(await gradeRepository.findAll());
}

module.exports = { list };
