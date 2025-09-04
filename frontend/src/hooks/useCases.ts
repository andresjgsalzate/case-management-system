import { useQuery } from "@tanstack/react-query";
import { caseService, type Case } from "../services/api";

export const useCases = () => {
  return useQuery<Case[], Error>({
    queryKey: ["cases"],
    queryFn: caseService.getAllCases,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};
