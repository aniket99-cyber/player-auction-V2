"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
class BaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async findById(id) {
        return this.model.findById(id).exec();
    }
    async findOne(filter) {
        return this.model.findOne(filter).exec();
    }
    async findMany(filter) {
        return this.model.find(filter).exec();
    }
    async create(data) {
        const created = new this.model(data);
        return (await created.save());
    }
    async updateById(id, data) {
        return this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec();
    }
    async deleteById(id) {
        const result = await this.model.findByIdAndDelete(id).exec();
        return result !== null;
    }
}
exports.BaseRepository = BaseRepository;
//# sourceMappingURL=BaseRepository.js.map