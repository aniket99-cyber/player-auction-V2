"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBus = void 0;
const node_events_1 = require("node:events");
class TypedEventBus {
    emitter = new node_events_1.EventEmitter();
    constructor() {
        this.emitter.setMaxListeners(50);
    }
    emit(event, payload) {
        this.emitter.emit(event, payload);
    }
    on(event, listener) {
        this.emitter.on(event, listener);
    }
    off(event, listener) {
        this.emitter.off(event, listener);
    }
}
exports.eventBus = new TypedEventBus();
//# sourceMappingURL=EventBus.js.map