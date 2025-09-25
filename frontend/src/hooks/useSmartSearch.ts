import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { knowledgeApi } from "../services/knowledge.service";

interface SearchSuggestion {
  documents: Array<{ id: string; title: string; type: "document" }>;
  tags: Array<{ name: string; type: "tag" }>;
  cases: Array<{ id: string; caseNumber: string; type: "case" }>;
}

interface UseSmartSearchOptions {
  debounceMs?: number;
  minChars?: number;
  maxSuggestions?: number;
}

export const useSmartSearch = (options: UseSmartSearchOptions = {}) => {
  const { debounceMs = 300, minChars = 2, maxSuggestions = 5 } = options;

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounce del término de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  // Query para sugerencias
  const {
    data: suggestions,
    isLoading: suggestionsLoading,
    error: suggestionsError,
  } = useQuery<SearchSuggestion>({
    queryKey: ["search-suggestions", debouncedTerm],
    queryFn: () =>
      knowledgeApi.documents.getSearchSuggestions(
        debouncedTerm,
        maxSuggestions
      ),
    enabled: debouncedTerm.length >= minChars && showSuggestions,
    staleTime: 30000, // 30 segundos
  });

  // Función para realizar búsqueda
  const performSearch = useCallback(async (term: string, filters: any = {}) => {
    if (!term.trim()) return { documents: [], total: 0 };

    setIsSearching(true);
    try {
      const result = await knowledgeApi.documents.enhancedSearch({
        search: term,
        ...filters,
      });
      return result;
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Función para manejar selección de sugerencia
  const selectSuggestion = useCallback((suggestion: any) => {
    if (suggestion.type === "document") {
      setSearchTerm(suggestion.title);
    } else if (suggestion.type === "tag") {
      setSearchTerm(suggestion.name);
    } else if (suggestion.type === "case") {
      setSearchTerm(suggestion.caseNumber);
    }
    setShowSuggestions(false);
  }, []);

  // Función para limpiar búsqueda
  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setDebouncedTerm("");
    setShowSuggestions(false);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    suggestions,
    suggestionsLoading,
    suggestionsError,
    showSuggestions,
    setShowSuggestions,
    isSearching,
    performSearch,
    selectSuggestion,
    clearSearch,
    hasResults:
      suggestions &&
      (suggestions.documents.length > 0 ||
        suggestions.tags.length > 0 ||
        suggestions.cases.length > 0),
  };
};

export default useSmartSearch;
