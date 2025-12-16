"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationController = void 0;
const database_1 = require("../config/database");
const Case_1 = require("../entities/Case");
class MigrationController {
    async updateCaseScoring(req, res) {
        try {
            const caseRepository = database_1.AppDataSource.getRepository(Case_1.Case);
            const cases = await caseRepository.find();
            console.log(`Actualizando ${cases.length} casos...`);
            const updatedCases = [];
            for (const caseItem of cases) {
                caseItem.calculateScoring();
                await caseRepository.save(caseItem);
                updatedCases.push({
                    id: caseItem.id,
                    numeroCaso: caseItem.numeroCaso,
                    puntuacionAnterior: `${Math.round((caseItem.puntuacion / 15) * 100)}%`,
                    puntuacionNueva: caseItem.puntuacion,
                    clasificacionNueva: caseItem.clasificacion,
                });
            }
            console.log("Migración completada exitosamente");
            res.json({
                success: true,
                message: `Se actualizaron ${cases.length} casos exitosamente`,
                updatedCases,
            });
        }
        catch (error) {
            console.error("Error en migración de puntuaciones:", error);
            res.status(500).json({
                success: false,
                message: "Error al actualizar las puntuaciones de los casos",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
}
exports.MigrationController = MigrationController;
