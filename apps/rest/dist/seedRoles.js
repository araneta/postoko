"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("./index");
var schema_1 = require("./schema");
var drizzle_orm_1 = require("drizzle-orm");
var defaultRoles = [
    { name: 'admin', description: 'Full access to all features and settings' },
    { name: 'manager', description: 'Manage sales, inventory, employees, view reports' },
    { name: 'cashier', description: 'Process sales, view products, limited access' },
    { name: 'staff', description: 'Limited access, e.g., inventory or support tasks' },
];
function seedRoles() {
    return __awaiter(this, void 0, void 0, function () {
        var _i, defaultRoles_1, role, exists;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _i = 0, defaultRoles_1 = defaultRoles;
                    _a.label = 1;
                case 1:
                    if (!(_i < defaultRoles_1.length)) return [3 /*break*/, 6];
                    role = defaultRoles_1[_i];
                    return [4 /*yield*/, index_1.db.select().from(schema_1.rolesTable).where((0, drizzle_orm_1.eq)(schema_1.rolesTable.name, role.name))];
                case 2:
                    exists = _a.sent();
                    if (!(exists.length === 0)) return [3 /*break*/, 4];
                    return [4 /*yield*/, index_1.db.insert(schema_1.rolesTable).values(role)];
                case 3:
                    _a.sent();
                    console.log("Inserted role: ".concat(role.name));
                    return [3 /*break*/, 5];
                case 4:
                    console.log("Role already exists: ".concat(role.name));
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    process.exit(0);
                    return [2 /*return*/];
            }
        });
    });
}
seedRoles().catch(function (err) {
    console.error('Error seeding roles:', err);
    process.exit(1);
});
