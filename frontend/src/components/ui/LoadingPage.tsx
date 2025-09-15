import React from "react";

interface LoadingPageProps {
  title?: string;
  subtitle?: string;
  steps?: string[];
  currentStep?: number;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({
  title = "Cargando...",
  subtitle = "Por favor espera mientras se configura el sistema",
  steps = [],
  currentStep = 0,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          {/* Spinner animado */}
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
          </div>

          {/* Título */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h2>

          {/* Subtítulo */}
          <p className="text-gray-600 dark:text-gray-400 mb-6">{subtitle}</p>

          {/* Pasos de progreso */}
          {steps.length > 0 && (
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                    index < currentStep
                      ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                      : index === currentStep
                      ? "bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800"
                      : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {/* Icono de estado */}
                  <div className="flex-shrink-0">
                    {index < currentStep ? (
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-2 h-2 text-white"
                          fill="currentColor"
                          viewBox="0 0 8 8"
                        >
                          <path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26l2.974 2.99L8 2.193z" />
                        </svg>
                      </div>
                    ) : index === currentStep ? (
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    )}
                  </div>

                  {/* Texto del paso */}
                  <span
                    className={`text-sm font-medium ${
                      index < currentStep
                        ? "text-green-700 dark:text-green-400"
                        : index === currentStep
                        ? "text-indigo-700 dark:text-indigo-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {step}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
