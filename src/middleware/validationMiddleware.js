function validate(schema) {
  return (req, res, next) => {
    const options = {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    };

    const { error, value } = schema.validate(req.body, options);

    if (error) {
      res.status(400);
      return next(new Error(error.details.map((d) => d.message).join(', ')));
    }

    req.body = value;
    return next();
  };
}

module.exports = {
  validate,
};

