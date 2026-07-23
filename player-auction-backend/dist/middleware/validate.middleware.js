"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const ApiError_1 = require("@utils/ApiError");
function validate(schema, target = 'body') {
    return (req, _res, next) => {
        const { error, value } = schema.validate(req[target], {
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) {
            const details = error.details.map((d) => d.message);
            throw ApiError_1.ApiError.badRequest('Validation failed', details);
        }
        req[target] = value;
        next();
    };
}
//# sourceMappingURL=validate.middleware.js.map