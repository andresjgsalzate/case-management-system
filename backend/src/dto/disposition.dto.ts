import {
  IsString,
  IsDateString,
  IsOptional,
  IsUUID,
  Matches,
  MaxLength,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
} from "class-validator";
import { Transform } from "class-transformer";

export class CreateDispositionDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9-_]+$/, {
    message:
      "El número de caso solo puede contener letras, números, guiones y guiones bajos",
  })
  caseNumber: string;

  @IsOptional()
  @IsUUID()
  caseId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  scriptName: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  svnRevisionNumber?: string;

  @IsUUID()
  @IsNotEmpty()
  applicationId: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observations?: string;
}

export class UpdateDispositionDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9-_]+$/, {
    message:
      "El número de caso solo puede contener letras, números, guiones y guiones bajos",
  })
  caseNumber?: string;

  @IsOptional()
  @IsUUID()
  caseId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  scriptName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  svnRevisionNumber?: string;

  @IsOptional()
  @IsUUID()
  applicationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observations?: string;
}

export class DispositionFiltersDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(2000)
  @Max(2100)
  year?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(12)
  month?: number;

  @IsOptional()
  @IsUUID()
  applicationId?: string;

  @IsOptional()
  @IsString()
  caseNumber?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;
}
