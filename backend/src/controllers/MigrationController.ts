import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Case } from "../entities/Case";

export class MigrationController {
  /**
   * Actualiza las puntuaciones y clasificaciones de todos los casos existentes
   * con la nueva lógica de clasificación
   */
  async updateCaseScoring(req: Request, res: Response) {
    try {
      const caseRepository = AppDataSource.getRepository(Case);

      // Obtener todos los casos
      const cases = await caseRepository.find();

      console.log(`Actualizando ${cases.length} casos...`);

      const updatedCases = [];

      // Actualizar cada caso
      for (const caseItem of cases) {
        // Recalcular puntuación y clasificación
        caseItem.calculateScoring();

        // Guardar los cambios
        await caseRepository.save(caseItem);

        updatedCases.push({
          id: caseItem.id,
          numeroCaso: caseItem.numeroCaso,
          puntuacionAnterior: `${Math.round(
            (caseItem.puntuacion / 15) * 100
          )}%`, // aproximación de lo que era antes
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
    } catch (error) {
      console.error("Error en migración de puntuaciones:", error);
      res.status(500).json({
        success: false,
        message: "Error al actualizar las puntuaciones de los casos",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
}
