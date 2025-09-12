import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ArchiveController } from "../controllers/ArchiveController";
import { ArchiveService } from "../services/ArchiveService";
import { ArchivedCase } from "../entities/archive/ArchivedCase.entity";
import { ArchivedTodo } from "../entities/archive/ArchivedTodo.entity";
import { UserProfile } from "../entities/UserProfile";

@Module({
  imports: [
    TypeOrmModule.forFeature([ArchivedCase, ArchivedTodo, UserProfile]),
  ],
  controllers: [ArchiveController],
  providers: [ArchiveService],
  exports: [ArchiveService],
})
export class ArchiveModule {}
