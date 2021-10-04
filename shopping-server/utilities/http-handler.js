
module.exports.methodNotAllowed = (req, res, next) => res.status(405).json({detail: 'method not allowed'}).send();