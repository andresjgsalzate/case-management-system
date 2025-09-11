import { DataSource } from "typeorm";
import { config } from "./environment";
import {
  Role,
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
  Permission,
  RolePermission,
  ArchivedCase,
  ArchivedTodo,
} from "../entities";
import { DocumentType } from "../entities/DocumentType";
import { KnowledgeDocument } from "../entities/KnowledgeDocument";
import { KnowledgeDocumentTag } from "../entities/KnowledgeDocumentTag";
import { KnowledgeDocumentVersion } from "../entities/KnowledgeDocumentVersion";
import { KnowledgeDocumentAttachment } from "../entities/KnowledgeDocumentAttachment";
import { KnowledgeDocumentRelation } from "../entities/KnowledgeDocumentRelation";
import { KnowledgeDocumentFeedback } from "../entities/KnowledgeDocumentFeedback";
import { KnowledgeTag } from "../entities/KnowledgeTag";
import { KnowledgeDocumentTagRelation } from "../entities/KnowledgeDocumentTagRelation";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  synchronize: config.env === "development",
  logging: config.env === "development",
  entities: [
    Role,
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
    Permission,
    RolePermission,
    ArchivedCase,
    ArchivedTodo,
    DocumentType,
    KnowledgeDocument,
    KnowledgeDocumentTag,
    KnowledgeDocumentVersion,
    KnowledgeDocumentAttachment,
    KnowledgeDocumentRelation,
    KnowledgeDocumentFeedback,
    KnowledgeTag,
    KnowledgeDocumentTagRelation,
  ],
  migrations: ["src/database/migrations/**/*.ts"],
  subscribers: ["src/database/subscribers/**/*.ts"],
  ssl: config.env === "production" ? { rejectUnauthorized: false } : false,
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connection established successfully");
  } catch (error) {
    console.error("❌ Error during database initialization:", error);
    process.exit(1);
  }
};
