"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const User_model_1 = require("@models/User.model");
const BaseRepository_1 = require("@repositories/implementations/BaseRepository");
class UserRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(User_model_1.UserModel);
    }
    async findByEmail(email, includeSensitive = false) {
        const query = this.model.findOne({ email: email.toLowerCase() });
        if (includeSensitive) {
            query.select('+passwordHash +refreshTokenHash');
        }
        return query.exec();
    }
}
exports.UserRepository = UserRepository;
//# sourceMappingURL=UserRepository.js.map