import React, { useState, useRef } from "react";
import { useUploadFiles, formatFileSize } from "../hooks/useFileUpload";

interface FileUploadProps {
  documentId: string;
  onUploadComplete?: () => void;
  className?: string;
  maxFiles?: number;
  maxFileSize?: number; // en bytes
}

const FileUpload: React.FC<FileUploadProps> = ({
  documentId,
  onUploadComplete,
  className = "",
  maxFiles = 10,
  maxFileSize = 50 * 1024 * 1024, // 50MB por defecto
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadFiles = useUploadFiles();

  const allowedTypes = [
    // Imágenes
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".svg",
    // Documentos
    ".pdf",
    ".doc",
    ".docx",
    ".txt",
    ".rtf",
    // Hojas de cálculo
    ".xls",
    ".xlsx",
    ".csv",
    // Presentaciones
    ".ppt",
    ".pptx",
    // Videos
    ".mp4",
    ".avi",
    ".mov",
    ".wmv",
    ".webm",
    // Audio
    ".mp3",
    ".wav",
    ".ogg",
    ".aac",
    // Archivos comprimidos
    ".zip",
    ".rar",
    ".7z",
    ".tar",
    ".gz",
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFileSelection(files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFileSelection(files);
    }
  };

  const handleFileSelection = (files: File[]) => {
    // Validar número de archivos
    if (files.length > maxFiles) {
      alert(`Solo se pueden subir máximo ${maxFiles} archivos a la vez.`);
      return;
    }

    // Validar tipos y tamaños
    const validFiles = [];
    const errors = [];

    for (const file of files) {
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

      if (!allowedTypes.includes(fileExtension)) {
        errors.push(`${file.name}: Tipo de archivo no permitido`);
        continue;
      }

      if (file.size > maxFileSize) {
        errors.push(
          `${file.name}: Tamaño excede el límite de ${formatFileSize(
            maxFileSize
          )}`
        );
        continue;
      }

      validFiles.push(file);
    }

    if (errors.length > 0) {
      alert(`Errores de validación:\n${errors.join("\n")}`);
    }

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      const fileList = new DataTransfer();
      selectedFiles.forEach((file) => fileList.items.add(file));

      const result = await uploadFiles.mutateAsync({
        documentId,
        files: fileList.files,
      });

      if (result.totalUploaded > 0) {
        setSelectedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        onUploadComplete?.();
      }

      if (result.errors.length > 0) {
        const errorMessages = result.errors
          .map((err) => `${err.fileName}: ${err.error}`)
          .join("\n");
        alert(`Algunos archivos no se pudieron subir:\n${errorMessages}`);
      }
    } catch (error) {
      console.error("Error subiendo archivos:", error);
      alert("Error subiendo archivos. Inténtalo de nuevo.");
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((files) => files.filter((_, i) => i !== index));
  };

  const clearSelection = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Área de drop/selección */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer
          ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(",")}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="mt-4">
            <p className="text-lg font-medium text-gray-900">
              {isDragging
                ? "Suelta los archivos aquí"
                : "Arrastra archivos aquí"}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              o{" "}
              <span className="text-blue-600 underline">
                haz clic para seleccionar archivos
              </span>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Máximo {maxFiles} archivos • {formatFileSize(maxFileSize)} por
              archivo
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Formatos: imágenes, documentos, hojas de cálculo, presentaciones,
              videos, audio, archivos comprimidos
            </p>
          </div>
        </div>
      </div>

      {/* Lista de archivos seleccionados */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">
              Archivos seleccionados ({selectedFiles.length})
            </h4>
            <button
              onClick={clearSelection}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Limpiar selección
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">📁</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => removeSelectedFile(index)}
                  className="p-1 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50"
                  title="Remover archivo"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Botón de subida */}
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={clearSelection}
              disabled={uploadFiles.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleUpload}
              disabled={uploadFiles.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {uploadFiles.isPending ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Subiendo...</span>
                </>
              ) : (
                <span>Subir archivos</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
