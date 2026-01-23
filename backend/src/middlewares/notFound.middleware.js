// Not found handler (placeholder)

module.exports = function notFoundMiddleware(req, res, next) {
  res.status(404).json({ message: "Not Found" });
};
