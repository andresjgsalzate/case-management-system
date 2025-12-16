import { DataSource } from "typeorm";
import { config } from "./config/environment";

// Import entities explicitly
import { Role } from "./entities/Role";
import { Permission } from "./entities/Permission";
import { RolePermission } from "./entities/RolePermission";
import { UserProfile } from "./entities/UserProfile";
import { Application } from "./entities/Application";
import { Origin } from "./entities/Origin";
import { Case } from "./entities/Case";
import { CaseStatusControl } from "./entities/CaseStatusControl";
import { CaseControl } from "./entities/CaseControl";
import { TimeEntry } from "./entities/TimeEntry";
import { ManualTimeEntry } from "./entities/ManualTimeEntry";
import { Disposition } from "./entities/Disposition";
import { Todo } from "./entities/Todo";
import { TodoPriority } from "./entities/TodoPriority";
import { TodoControl } from "./entities/TodoControl";
import { TodoTimeEntry } from "./entities/TodoTimeEntry";
import { TodoManualTimeEntry } from "./entities/TodoManualTimeEntry";
import { Note } from "./entities/Note";
import { ArchivedCase } from "./entities/ArchivedCase";
import { ArchivedTodo } from "./entities/archive/ArchivedTodo.entity";
import { KnowledgeDocument } from "./entities/KnowledgeDocument";
import { KnowledgeDocumentAttachment } from "./entities/KnowledgeDocumentAttachment";
import { KnowledgeDocumentVersion } from "./entities/KnowledgeDocumentVersion";
import { KnowledgeDocumentFeedback } from "./entities/KnowledgeDocumentFeedback";
import { KnowledgeDocumentRelation } from "./entities/KnowledgeDocumentRelation";
import { KnowledgeTag } from "./entities/KnowledgeTag";
import { KnowledgeDocumentTag } from "./entities/KnowledgeDocumentTag";
import { KnowledgeDocumentTagRelation } from "./entities/KnowledgeDocumentTagRelation";
import { DocumentType } from "./entities/DocumentType";
import { AuditLog } from "./entities/AuditLog";
import { AuditEntityChange } from "./entities/AuditEntityChange";
import { Team } from "./entities/Team";
import { TeamMember } from "./entities/TeamMember";
import { UserSession } from "./entities/UserSession";

export default new DataSource({
  type: "postgres",
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  synchronize: false,
  logging: true,
  entities: [
    Role,
    Permission,
    RolePermission,
    UserProfile,
    Application,
    Origin,
    Case,
    CaseStatusControl,
    CaseControl,
    TimeEntry,
    ManualTimeEntry,
    Disposition,
    Todo,
    TodoPriority,
    TodoControl,
    TodoTimeEntry,
    TodoManualTimeEntry,
    Note,
    ArchivedCase,
    ArchivedTodo,
    KnowledgeDocument,
    KnowledgeDocumentAttachment,
    KnowledgeDocumentVersion,
    KnowledgeDocumentFeedback,
    KnowledgeDocumentRelation,
    KnowledgeTag,
    KnowledgeDocumentTag,
    KnowledgeDocumentTagRelation,
    DocumentType,
    AuditLog,
    AuditEntityChange,
    Team,
    TeamMember,
    UserSession,
  ],
  migrations: ["src/database/migrations/**/*.ts"],
  subscribers: ["src/database/subscribers/**/*.ts"],
});
