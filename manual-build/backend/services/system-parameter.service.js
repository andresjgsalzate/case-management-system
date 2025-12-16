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
exports.SystemParameterService = void 0;
const SystemParameter_1 = require("../entities/SystemParameter");
const crypto = __importStar(require("crypto"));
class NotFoundException extends Error {
    constructor(message) {
        super(message);
        this.name = "NotFoundException";
    }
}
class BadRequestException extends Error {
    constructor(message) {
        super(message);
        this.name = "BadRequestException";
    }
}
class SystemParameterService {
    constructor(systemParameterRepository) {
        this.systemParameterRepository = systemParameterRepository;
        this.parameterCache = new Map();
        this.cacheExpiry = new Map();
        this.CACHE_DURATION = 5 * 60 * 1000;
        this.ENCRYPTION_KEY = process.env.PARAMETER_ENCRYPTION_KEY ||
            "default-encryption-key-change-this";
        this.initializeCache();
    }
    async encrypt(text) {
        const algorithm = "aes-256-cbc";
        const key = Buffer.from(this.ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(algorithm, key);
        let encrypted = cipher.update(text, "utf8", "hex");
        encrypted += cipher.final("hex");
        return iv.toString("hex") + ":" + encrypted;
    }
    async decrypt(encryptedText) {
        const algorithm = "aes-256-cbc";
        const key = Buffer.from(this.ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
        const textParts = encryptedText.split(":");
        const iv = Buffer.from(textParts.shift(), "hex");
        const encrypted = textParts.join(":");
        const decipher = crypto.createDecipher(algorithm, key);
        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    }
    async findAll() {
        return this.systemParameterRepository.find({
            where: { isActive: true },
            order: { parameterCategory: "ASC", parameterKey: "ASC" },
        });
    }
    async findByCategory(category) {
        return this.systemParameterRepository.find({
            where: {
                parameterCategory: category,
                isActive: true,
            },
            order: { parameterKey: "ASC" },
        });
    }
    async findByKey(key) {
        const parameter = await this.systemParameterRepository.findOne({
            where: {
                parameterKey: key,
                isActive: true,
            },
        });
        if (parameter && parameter.isEncrypted && parameter.parameterValue) {
            try {
                parameter.parameterValue = await this.decrypt(parameter.parameterValue);
            }
            catch (error) {
                console.error(`Error decrypting parameter ${key}:`, error);
                parameter.parameterValue = null;
            }
        }
        return parameter;
    }
    async getValue(key) {
        const cachedValue = this.getCachedValue(key);
        if (cachedValue !== undefined) {
            return cachedValue;
        }
        const parameter = await this.findByKey(key);
        if (!parameter) {
            console.warn(`Parameter ${key} not found`);
            return null;
        }
        const value = parameter.getParsedValue();
        this.setCachedValue(key, value);
        return value;
    }
    async setValue(key, value, userId) {
        const parameter = await this.findByKey(key);
        if (!parameter) {
            throw new NotFoundException(`Parameter ${key} not found`);
        }
        const validationErrors = parameter.validateValue(value);
        if (validationErrors.length > 0) {
            throw new BadRequestException(`Validation errors: ${validationErrors.join(", ")}`);
        }
        parameter.setParsedValue(value);
        if (parameter.isEncrypted && parameter.parameterValue) {
            parameter.parameterValue = await this.encrypt(parameter.parameterValue);
        }
        parameter.updatedBy = userId || null;
        const savedParameter = await this.systemParameterRepository.save(parameter);
        this.invalidateCache(key);
        return savedParameter;
    }
    async create(createDto, userId) {
        const existing = await this.systemParameterRepository.findOne({
            where: { parameterKey: createDto.parameterKey },
        });
        if (existing) {
            throw new BadRequestException(`Parameter with key ${createDto.parameterKey} already exists`);
        }
        const parameter = new SystemParameter_1.SystemParameter();
        Object.assign(parameter, createDto);
        parameter.createdBy = userId || null;
        if (createDto.parameterValue !== undefined) {
            const validationErrors = parameter.validateValue(createDto.parameterValue);
            if (validationErrors.length > 0) {
                throw new BadRequestException(`Validation errors: ${validationErrors.join(", ")}`);
            }
            parameter.setParsedValue(createDto.parameterValue);
            if (parameter.isEncrypted && parameter.parameterValue) {
                parameter.parameterValue = await this.encrypt(parameter.parameterValue);
            }
        }
        return this.systemParameterRepository.save(parameter);
    }
    async update(id, updateDto, userId) {
        const parameter = await this.systemParameterRepository.findOne({
            where: { id },
        });
        if (!parameter) {
            throw new NotFoundException(`Parameter with id ${id} not found`);
        }
        Object.assign(parameter, updateDto);
        parameter.updatedBy = userId || null;
        if (updateDto.parameterValue !== undefined) {
            const validationErrors = parameter.validateValue(updateDto.parameterValue);
            if (validationErrors.length > 0) {
                throw new BadRequestException(`Validation errors: ${validationErrors.join(", ")}`);
            }
            parameter.setParsedValue(updateDto.parameterValue);
            if (parameter.isEncrypted && parameter.parameterValue) {
                parameter.parameterValue = await this.encrypt(parameter.parameterValue);
            }
        }
        const savedParameter = await this.systemParameterRepository.save(parameter);
        this.invalidateCache(parameter.parameterKey);
        return savedParameter;
    }
    async remove(id, userId) {
        const parameter = await this.systemParameterRepository.findOne({
            where: { id },
        });
        if (!parameter) {
            throw new NotFoundException(`Parameter with id ${id} not found`);
        }
        parameter.isActive = false;
        parameter.updatedBy = userId || null;
        await this.systemParameterRepository.save(parameter);
        this.invalidateCache(parameter.parameterKey);
    }
    async getConfigByCategory(category) {
        const parameters = await this.findByCategory(category);
        const config = {};
        for (const param of parameters) {
            config[param.parameterKey] = param.getParsedValue();
        }
        return config;
    }
    async validateRequiredParameters() {
        const requiredParams = await this.systemParameterRepository.find({
            where: {
                isRequired: true,
                isActive: true,
            },
        });
        const errors = [];
        for (const param of requiredParams) {
            if (!param.parameterValue && !param.defaultValue) {
                errors.push(`Required parameter ${param.parameterKey} is not configured`);
            }
        }
        return errors;
    }
    async getConfigurationStats() {
        const total = await this.systemParameterRepository.count({
            where: { isActive: true },
        });
        const byCategory = await this.systemParameterRepository
            .createQueryBuilder("sp")
            .select("sp.parameter_category as category")
            .addSelect("COUNT(*) as count")
            .where("sp.is_active = true")
            .groupBy("sp.parameter_category")
            .getRawMany();
        const configured = await this.systemParameterRepository.count({
            where: {
                isActive: true,
                parameterValue: "IS NOT NULL",
            },
        });
        const required = await this.systemParameterRepository.count({
            where: {
                isActive: true,
                isRequired: true,
            },
        });
        return {
            total,
            configured,
            required,
            byCategory: byCategory.reduce((acc, item) => {
                acc[item.category] = parseInt(item.count);
                return acc;
            }, {}),
        };
    }
    getCachedValue(key) {
        const expiry = this.cacheExpiry.get(key);
        if (expiry && expiry > Date.now()) {
            return this.parameterCache.get(key);
        }
        this.parameterCache.delete(key);
        this.cacheExpiry.delete(key);
        return undefined;
    }
    setCachedValue(key, value) {
        this.parameterCache.set(key, value);
        this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
    }
    invalidateCache(key) {
        if (key) {
            this.parameterCache.delete(key);
            this.cacheExpiry.delete(key);
        }
        else {
            this.parameterCache.clear();
            this.cacheExpiry.clear();
        }
    }
    async initializeCache() {
        try {
            const parameters = await this.findAll();
            for (const param of parameters) {
                const value = param.getParsedValue();
                this.setCachedValue(param.parameterKey, value);
            }
            console.log(`Initialized cache with ${parameters.length} system parameters`);
        }
        catch (error) {
            console.error("Error initializing system parameter cache:", error);
        }
    }
    async refreshCache() {
        this.invalidateCache();
        await this.initializeCache();
    }
}
exports.SystemParameterService = SystemParameterService;
