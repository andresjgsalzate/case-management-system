"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const environment_1 = require("./environment");
const entities_1 = require("../entities");
const UserSession_1 = require("../entities/UserSession");
const DocumentType_1 = require("../entities/DocumentType");
const KnowledgeDocument_1 = require("../entities/KnowledgeDocument");
const KnowledgeDocumentTag_1 = require("../entities/KnowledgeDocumentTag");
const KnowledgeDocumentVersion_1 = require("../entities/KnowledgeDocumentVersion");
const KnowledgeDocumentAttachment_1 = require("../entities/KnowledgeDocumentAttachment");
const KnowledgeDocumentRelation_1 = require("../entities/KnowledgeDocumentRelation");
const KnowledgeDocumentFeedback_1 = require("../entities/KnowledgeDocumentFeedback");
const KnowledgeTag_1 = require("../entities/KnowledgeTag");
const KnowledgeDocumentTagRelation_1 = require("../entities/KnowledgeDocumentTagRelation");
const Team_1 = require("../entities/Team");
const TeamMember_1 = require("../entities/TeamMember");
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: environment_1.config.database.host,
    port: environment_1.config.database.port,
    username: environment_1.config.database.username,
    password: environment_1.config.database.password,
    database: environment_1.config.database.database,
    synchronize: environment_1.config.env === "development",
    logging: environment_1.config.env === "development",
    entities: [
        entities_1.Role,
        entities_1.UserProfile,
        entities_1.Application,
        entities_1.Origin,
        entities_1.Case,
        entities_1.CaseStatusControl,
        entities_1.CaseControl,
        entities_1.TimeEntry,
        entities_1.ManualTimeEntry,
        entities_1.Disposition,
        entities_1.Todo,
        entities_1.TodoPriority,
        entities_1.TodoControl,
        entities_1.TodoTimeEntry,
        entities_1.TodoManualTimeEntry,
        entities_1.Note,
        entities_1.Permission,
        entities_1.RolePermission,
        entities_1.ArchivedCase,
        entities_1.ArchivedTodo,
        DocumentType_1.DocumentType,
        KnowledgeDocument_1.KnowledgeDocument,
        KnowledgeDocumentTag_1.KnowledgeDocumentTag,
        KnowledgeDocumentVersion_1.KnowledgeDocumentVersion,
        KnowledgeDocumentAttachment_1.KnowledgeDocumentAttachment,
        KnowledgeDocumentRelation_1.KnowledgeDocumentRelation,
        KnowledgeDocumentFeedback_1.KnowledgeDocumentFeedback,
        KnowledgeTag_1.KnowledgeTag,
        KnowledgeDocumentTagRelation_1.KnowledgeDocumentTagRelation,
        Team_1.Team,
        TeamMember_1.TeamMember,
        entities_1.AuditLog,
        entities_1.AuditEntityChange,
        UserSession_1.UserSession,
    ],
    migrations: ["src/database/migrations/**/*.ts"],
    subscribers: ["src/database/subscribers/**/*.ts"],
    ssl: environment_1.config.env === "production" ? { rejectUnauthorized: false } : false,
});
const initializeDatabase = async () => {
    try {
        await exports.AppDataSource.initialize();
        console.log("✅ Database connection established successfully");
    }
    catch (error) {
        console.error("❌ Error during database initialization:", error);
        process.exit(1);
    }
};
exports.initializeDatabase = initializeDatabase;
