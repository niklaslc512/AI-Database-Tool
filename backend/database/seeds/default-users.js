"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultUsers = void 0;
exports.getDefaultUserSettings = getDefaultUserSettings;
exports.generatePasswordHash = generatePasswordHash;
const bcrypt = __importStar(require("bcryptjs"));
exports.defaultUsers = [
    {
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123456',
        role: 'admin',
        displayName: '系统管理员',
        status: 'active'
    },
    {
        username: 'user',
        email: 'user@example.com',
        password: 'user123456',
        role: 'user',
        displayName: '普通用户',
        status: 'active'
    },
    {
        username: 'readonly',
        email: 'readonly@example.com',
        password: 'readonly123456',
        role: 'readonly',
        displayName: '只读用户',
        status: 'active'
    },
    {
        username: 'guest',
        email: 'guest@example.com',
        password: 'guest123456',
        role: 'guest',
        displayName: '访客用户',
        status: 'active'
    }
];
function getDefaultUserSettings() {
    return {
        theme: 'auto',
        language: 'zh-CN',
        timezone: 'Asia/Shanghai',
        notifications: {
            email: true,
            browser: true,
            security: true
        }
    };
}
async function generatePasswordHash(password, saltRounds = 12) {
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return { hash, salt };
}
//# sourceMappingURL=default-users.js.map