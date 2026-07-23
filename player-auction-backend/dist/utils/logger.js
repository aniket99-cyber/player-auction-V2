"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
function format(level, message, meta) {
    const timestamp = new Date().toISOString();
    const base = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    return meta !== undefined ? `${base} ${JSON.stringify(meta)}` : base;
}
exports.logger = {
    info: (message, meta) => console.log(format('info', message, meta)),
    warn: (message, meta) => console.warn(format('warn', message, meta)),
    error: (message, meta) => console.error(format('error', message, meta)),
    debug: (message, meta) => {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(format('debug', message, meta));
        }
    },
};
//# sourceMappingURL=logger.js.map