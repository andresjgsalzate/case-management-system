import { IsBoolean, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateDocumentFeedbackDto {
  @IsUUID()
  documentId: string;

  @IsBoolean()
  isHelpful: boolean;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class UpdateDocumentFeedbackDto {
  @IsOptional()
  @IsBoolean()
  isHelpful?: boolean;

  @IsOptional()
  @IsString()
  comment?: string;
}
