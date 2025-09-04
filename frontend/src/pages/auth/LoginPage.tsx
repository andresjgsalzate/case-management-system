import { Navigate } from "react-router-dom";

export const LoginPage = () => {
  // Temporal: redirigir directamente al dashboard hasta que tengamos auth
  return <Navigate to="/" replace />;

  // Aquí iría el componente de login real
  // return (
  //   <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
  //     <div className="sm:mx-auto sm:w-full sm:max-w-md">
  //       <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
  //         Iniciar sesión
  //       </h2>
  //     </div>
  //     <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
  //       <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
  //         {/* Formulario de login aquí */}
  //       </div>
  //     </div>
  //   </div>
  // );
};
