import { AppError } from '../utils/AppError.js';

/**
 * Validates `req[source]` against a zod schema and replaces it with the parsed
 * (coerced, defaulted) value. Usage: `validate({ body: schema, params: schema })`.
 */
export const validate = (schemas) => (req, _res, next) => {
  for (const [source, schema] of Object.entries(schemas)) {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      return next(AppError.badRequest('VALIDATION_ERROR', `Invalid ${source}`, issues));
    }
    req[source] = result.data;
  }
  return next();
};
