"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteController = void 0;
const NoteService_1 = require("../services/NoteService");
class NoteController {
    constructor() {
        this.getAllNotes = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    return res.status(401).json({ message: "Usuario no autenticado" });
                }
                console.log("Getting notes for user:", userId);
                const filters = {
                    search: req.query.search,
                    tags: req.query.tags
                        ? req.query.tags.split(",")
                        : undefined,
                    createdBy: req.query.createdBy,
                    assignedTo: req.query.assignedTo,
                    caseId: req.query.caseId,
                    isImportant: req.query.isImportant
                        ? req.query.isImportant === "true"
                        : undefined,
                    isArchived: req.query.isArchived
                        ? req.query.isArchived === "true"
                        : undefined,
                    hasReminder: req.query.hasReminder
                        ? req.query.hasReminder === "true"
                        : undefined,
                    dateFrom: req.query.dateFrom,
                    dateTo: req.query.dateTo,
                };
                console.log("Filters:", filters);
                const notes = await this.noteService.getAllNotes(filters, userId);
                console.log("Notes retrieved:", notes.length);
                res.json({ success: true, data: notes });
            }
            catch (error) {
                console.error("Error getting notes:", error);
                res.status(500).json({
                    success: false,
                    message: "Error al obtener las notas",
                    error: error instanceof Error ? error.message : "Error desconocido",
                });
            }
        };
        this.createNote = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    return res.status(401).json({ message: "Usuario no autenticado" });
                }
                console.log("Creating note for user:", userId);
                console.log("Note data:", req.body);
                const createNoteDto = {
                    title: req.body.title,
                    content: req.body.content,
                    noteType: req.body.noteType,
                    priority: req.body.priority,
                    difficultyLevel: req.body.difficultyLevel,
                    tags: req.body.tags || [],
                    caseId: req.body.caseId,
                    assignedTo: req.body.assignedTo,
                    isImportant: req.body.isImportant || false,
                    isTemplate: req.body.isTemplate || false,
                    reminderDate: req.body.reminderDate,
                    prerequisites: req.body.prerequisites,
                    complexityNotes: req.body.complexityNotes,
                    estimatedSolutionTime: req.body.estimatedSolutionTime,
                };
                const note = await this.noteService.createNote(createNoteDto, userId);
                res.status(201).json({
                    success: true,
                    data: note,
                    message: "Nota creada exitosamente",
                });
            }
            catch (error) {
                console.error("Error creating note:", error);
                res.status(500).json({
                    success: false,
                    message: "Error al crear la nota",
                    error: error instanceof Error ? error.message : "Error desconocido",
                });
            }
        };
        this.getNotesStats = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    return res.status(401).json({ message: "Usuario no autenticado" });
                }
                console.log("Getting notes stats for user:", userId);
                const stats = await this.noteService.getNotesStats(userId);
                res.json({ success: true, data: stats });
            }
            catch (error) {
                console.error("Error getting notes stats:", error);
                res.status(500).json({
                    success: false,
                    message: "Error al obtener estadísticas de notas",
                    error: error instanceof Error ? error.message : "Error desconocido",
                });
            }
        };
        this.updateNote = async (req, res) => {
            try {
                const noteId = req.params.id;
                const userId = req.user?.id;
                if (!userId) {
                    return res.status(401).json({ message: "Usuario no autenticado" });
                }
                if (!noteId) {
                    return res.status(400).json({ message: "ID de nota requerido" });
                }
                console.log("Updating note:", noteId, "for user:", userId);
                const updateNoteDto = {
                    title: req.body.title,
                    content: req.body.content,
                    noteType: req.body.noteType,
                    priority: req.body.priority,
                    difficultyLevel: req.body.difficultyLevel,
                    tags: req.body.tags,
                    assignedTo: req.body.assignedTo,
                    isImportant: req.body.isImportant,
                    isTemplate: req.body.isTemplate,
                    reminderDate: req.body.reminderDate,
                    prerequisites: req.body.prerequisites,
                    complexityNotes: req.body.complexityNotes,
                    estimatedSolutionTime: req.body.estimatedSolutionTime,
                };
                const note = await this.noteService.updateNote(noteId, updateNoteDto, userId);
                res.json({
                    success: true,
                    data: note,
                    message: "Nota actualizada exitosamente",
                });
            }
            catch (error) {
                console.error("Error updating note:", error);
                res.status(500).json({
                    success: false,
                    message: "Error al actualizar la nota",
                    error: error instanceof Error ? error.message : "Error desconocido",
                });
            }
        };
        this.deleteNote = async (req, res) => {
            try {
                const noteId = req.params.id;
                const userId = req.user?.id;
                if (!userId) {
                    return res.status(401).json({ message: "Usuario no autenticado" });
                }
                if (!noteId) {
                    return res.status(400).json({ message: "ID de nota requerido" });
                }
                console.log("Deleting note:", noteId, "for user:", userId);
                await this.noteService.deleteNote(noteId, userId);
                res.json({
                    success: true,
                    message: "Nota eliminada exitosamente",
                });
            }
            catch (error) {
                console.error("Error deleting note:", error);
                res.status(500).json({
                    success: false,
                    message: "Error al eliminar la nota",
                    error: error instanceof Error ? error.message : "Error desconocido",
                });
            }
        };
        this.toggleArchiveNote = async (req, res) => {
            try {
                const noteId = req.params.id;
                const userId = req.user?.id;
                if (!userId) {
                    return res.status(401).json({ message: "Usuario no autenticado" });
                }
                if (!noteId) {
                    return res.status(400).json({ message: "ID de nota requerido" });
                }
                console.log("Toggling archive for note:", noteId, "for user:", userId);
                const note = await this.noteService.toggleArchiveNote(noteId, userId);
                if (!note) {
                    return res.status(404).json({ message: "Nota no encontrada" });
                }
                res.json({
                    success: true,
                    data: note,
                    message: note.isArchived
                        ? "Nota archivada exitosamente"
                        : "Nota desarchivada exitosamente",
                });
            }
            catch (error) {
                console.error("Error toggling archive note:", error);
                res.status(500).json({
                    success: false,
                    message: "Error al archivar/desarchivar la nota",
                    error: error instanceof Error ? error.message : "Error desconocido",
                });
            }
        };
        this.noteService = new NoteService_1.NoteService();
    }
}
exports.NoteController = NoteController;
