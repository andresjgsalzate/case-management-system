import { useQuery } from "@tanstack/react-query";
import { applicationsApi, type Application } from "../services/api";

export const useApplications = () => {
  return useQuery<Application[], Error>({
    queryKey: ["applications"],
    queryFn: applicationsApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (reemplaza cacheTime en v5)
  });
};
