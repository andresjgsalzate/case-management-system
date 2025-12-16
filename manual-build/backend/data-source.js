"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const environment_1 = require("./config/environment");
const Role_1 = require("./entities/Role");
const Permission_1 = require("./entities/Permission");
const RolePermission_1 = require("./entities/RolePermission");
const UserProfile_1 = require("./entities/UserProfile");
const Application_1 = require("./entities/Application");
const Origin_1 = require("./entities/Origin");
const Case_1 = require("./entities/Case");
const CaseStatusControl_1 = require("./entities/CaseStatusControl");
const CaseControl_1 = require("./entities/CaseControl");
const TimeEntry_1 = require("./entities/TimeEntry");
const ManualTimeEntry_1 = require("./entities/ManualTimeEntry");
const Disposition_1 = require("./entities/Disposition");
const Todo_1 = require("./entities/Todo");
const TodoPriority_1 = require("./entities/TodoPriority");
const TodoControl_1 = require("./entities/TodoControl");
const TodoTimeEntry_1 = require("./entities/TodoTimeEntry");
const TodoManualTimeEntry_1 = require("./entities/TodoManualTimeEntry");
const Note_1 = require("./entities/Note");
const ArchivedCase_1 = require("./entities/ArchivedCase");
const ArchivedTodo_entity_1 = require("./entities/archive/ArchivedTodo.entity");
const KnowledgeDocument_1 = require("./entities/KnowledgeDocument");
const KnowledgeDocumentAttachment_1 = require("./entities/KnowledgeDocumentAttachment");
const KnowledgeDocumentVersion_1 = require("./entities/KnowledgeDocumentVersion");
const KnowledgeDocumentFeedback_1 = require("./entities/KnowledgeDocumentFeedback");
const KnowledgeDocumentRelation_1 = require("./entities/KnowledgeDocumentRelation");
const KnowledgeTag_1 = require("./entities/KnowledgeTag");
const KnowledgeDocumentTag_1 = require("./entities/KnowledgeDocumentTag");
const KnowledgeDocumentTagRelation_1 = require("./entities/KnowledgeDocumentTagRelation");
const DocumentType_1 = require("./entities/DocumentType");
const AuditLog_1 = require("./entities/AuditLog");
const AuditEntityChange_1 = require("./entities/AuditEntityChange");
const Team_1 = require("./entities/Team");
const TeamMember_1 = require("./entities/TeamMember");
exports.default = new typeorm_1.DataSource({
    type: "postgres",
    host: environment_1.config.database.host,
    port: environment_1.config.database.port,
    username: environment_1.config.database.username,
    password: environment_1.config.database.password,
    database: environment_1.config.database.database,
    synchronize: false,
    logging: true,
    entities: [
        Role_1.Role,
        Permission_1.Permission,
        RolePermission_1.RolePermission,
        UserProfile_1.UserProfile,
        Application_1.Application,
        Origin_1.Origin,
        Case_1.Case,
        CaseStatusControl_1.CaseStatusControl,
        CaseControl_1.CaseControl,
        TimeEntry_1.TimeEntry,
        ManualTimeEntry_1.ManualTimeEntry,
        Disposition_1.Disposition,
        Todo_1.Todo,
        TodoPriority_1.TodoPriority,
        TodoControl_1.TodoControl,
        TodoTimeEntry_1.TodoTimeEntry,
        TodoManualTimeEntry_1.TodoManualTimeEntry,
        Note_1.Note,
        ArchivedCase_1.ArchivedCase,
        ArchivedTodo_entity_1.ArchivedTodo,
        KnowledgeDocument_1.KnowledgeDocument,
        KnowledgeDocumentAttachment_1.KnowledgeDocumentAttachment,
        KnowledgeDocumentVersion_1.KnowledgeDocumentVersion,
        KnowledgeDocumentFeedback_1.KnowledgeDocumentFeedback,
        KnowledgeDocumentRelation_1.KnowledgeDocumentRelation,
        KnowledgeTag_1.KnowledgeTag,
        KnowledgeDocumentTag_1.KnowledgeDocumentTag,
        KnowledgeDocumentTagRelation_1.KnowledgeDocumentTagRelation,
        DocumentType_1.DocumentType,
        AuditLog_1.AuditLog,
        AuditEntityChange_1.AuditEntityChange,
        Team_1.Team,
        TeamMember_1.TeamMember,
    ],
    migrations: ["src/database/migrations/**/*.ts"],
    subscribers: ["src/database/subscribers/**/*.ts"],
});
