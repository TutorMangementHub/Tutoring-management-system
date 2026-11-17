const gradeRepository = require('../repositories/grade.repository');

function listGrades() {
    return gradeRepository.findAll();
}

module.exports = { listGrades };
