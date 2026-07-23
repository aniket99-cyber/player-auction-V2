"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const enums_1 = require("@constants/enums");
const userSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(enums_1.UserRole), default: enums_1.UserRole.VIEWER },
    team: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Team' },
    isActive: { type: Boolean, default: true },
    refreshTokenHash: { type: String, select: false },
}, { timestamps: true });
exports.UserModel = (0, mongoose_1.model)('User', userSchema);
//# sourceMappingURL=User.model.js.map