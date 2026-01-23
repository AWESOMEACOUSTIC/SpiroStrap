// Validation middleware (placeholder)

module.exports = function validateMiddleware(schema) {
  return (req, res, next) => {
    if (!schema) return next();
    return next();
  };
};
