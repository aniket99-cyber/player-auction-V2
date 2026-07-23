"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = require("express");
const auth_routes_1 = require("@routes/auth.routes");
const router = (0, express_1.Router)();
router.use('/auth', auth_routes_1.authRoutes);
exports.apiRouter = router;
//# sourceMappingURL=index.js.map