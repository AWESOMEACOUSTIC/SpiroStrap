// Request ID middleware (placeholder)

module.exports = function requestIdMiddleware(req, res, next) {
  req.id = req.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  next();
};
