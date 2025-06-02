"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const port = 3001;
app.use(express_1.default.json());
function testHandler(req, res) {
    res.status(200).json({ message: 'Test server running' });
}
app.get('/test', testHandler);
app.listen(port, () => {
    console.log(`Test server listening on port ${port}`);
});
//# sourceMappingURL=testServer.js.map