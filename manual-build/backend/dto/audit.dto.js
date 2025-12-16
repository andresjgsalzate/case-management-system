"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUDIT_VALIDATION_RULES = exports.AuditEntityType = exports.AuditModule = void 0;
var AuditModule;
(function (AuditModule) {
    AuditModule["CASES"] = "cases";
    AuditModule["TODOS"] = "todos";
    AuditModule["USERS"] = "users";
    AuditModule["ROLES"] = "roles";
    AuditModule["PERMISSIONS"] = "permissions";
    AuditModule["NOTES"] = "notes";
    AuditModule["TIME_TRACKING"] = "time_tracking";
    AuditModule["MANUAL_TIME_ENTRIES"] = "manual_time_entries";
    AuditModule["ADMIN"] = "admin";
    AuditModule["AUTH"] = "auth";
    AuditModule["ARCHIVE"] = "archive";
    AuditModule["DASHBOARD"] = "dashboard";
    AuditModule["SESSION_MANAGEMENT"] = "SessionManagement";
})(AuditModule || (exports.AuditModule = AuditModule = {}));
var AuditEntityType;
(function (AuditEntityType) {
    AuditEntityType["CASE"] = "cases";
    AuditEntityType["TODO"] = "todos";
    AuditEntityType["USER_PROFILE"] = "user_profiles";
    AuditEntityType["ROLE"] = "roles";
    AuditEntityType["PERMISSION"] = "permissions";
    AuditEntityType["NOTE"] = "notes";
    AuditEntityType["TIME_ENTRY"] = "time_entries";
    AuditEntityType["MANUAL_TIME_ENTRY"] = "manual_time_entries";
    AuditEntityType["TODO_TIME_ENTRY"] = "todo_time_entries";
    AuditEntityType["TODO_MANUAL_TIME_ENTRY"] = "todo_manual_time_entries";
    AuditEntityType["CASE_CONTROL"] = "case_control";
    AuditEntityType["TODO_CONTROL"] = "todo_control";
    AuditEntityType["APPLICATION"] = "applications";
    AuditEntityType["ORIGIN"] = "origins";
    AuditEntityType["DISPOSITION"] = "dispositions";
    AuditEntityType["KNOWLEDGE_DOCUMENT"] = "knowledge_documents";
    AuditEntityType["ARCHIVED_CASE"] = "archived_cases";
    AuditEntityType["ARCHIVED_TODO"] = "archived_todos";
})(AuditEntityType || (exports.AuditEntityType = AuditEntityType = {}));
exports.AUDIT_VALIDATION_RULES = {
    MAX_ENTITY_NAME_LENGTH: 500,
    MAX_USER_NAME_LENGTH: 500,
    MAX_MODULE_LENGTH: 50,
    MAX_FIELD_NAME_LENGTH: 100,
    MAX_FIELD_TYPE_LENGTH: 50,
    MAX_CHANGE_VALUE_LENGTH: 10000,
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    DEFAULT_RETENTION_DAYS: 365,
    MAX_RETENTION_DAYS: 2555,
};
