import React, { useState, useEffect } from "react";
import {
  TagIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "../../contexts/ToastContext";
import { tagService } from "../../services/tagService";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import type { Tag, TagFilters, TagCategory } from "../../types/tag";
import { TAG_CATEGORIES } from "../../types/tag";
import TagCreateModal from "../../components/admin/tags/TagCreateModal";
import TagEditModal from "../../components/admin/tags/TagEditModal";
import TagDeleteModal from "../../components/admin/tags/TagDeleteModal";

export default function TagsPage() {
  const { success, error: showError } = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TagCategory | "all">(
    "all"
  );
  const [showInactiveOnly, setShowInactiveOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);

  // Cargar etiquetas
  const loadTags = async () => {
    try {
      setLoading(true);
      const filters: TagFilters = {
        category: selectedCategory,
        isActive: showInactiveOnly ? false : undefined,
        search: searchTerm || undefined,
      };

      const response = await tagService.getAllTags(filters);
      setTags(response.data);
    } catch (error: any) {
      console.error("Error loading tags:", error);
      showError(error.message || "Error al cargar las etiquetas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, [selectedCategory, showInactiveOnly]);

  // Filtrar etiquetas por búsqueda
  const filteredTags = tags.filter(
    (tag) =>
      tag.tagName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tag.description &&
        tag.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Manejar creación de etiqueta
  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    loadTags();
  };

  // Manejar edición de etiqueta
  const handleEditClick = (tag: Tag) => {
    setSelectedTag(tag);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedTag(null);
    loadTags();
  };

  // Manejar eliminación de etiqueta
  const handleDeleteClick = (tag: Tag) => {
    setSelectedTag(tag);
    setShowDeleteModal(true);
  };

  const handleDeleteSuccess = () => {
    setShowDeleteModal(false);
    setSelectedTag(null);
    loadTags();
  };

  // Cambiar estado de etiqueta
  const handleToggleStatus = async (tag: Tag) => {
    try {
      await tagService.toggleTagStatus(tag.id);
      success(
        `Etiqueta ${tag.isActive ? "desactivada" : "activada"} exitosamente`
      );
      loadTags();
    } catch (error: any) {
      showError(error.message || "Error al cambiar el estado de la etiqueta");
    }
  };

  const getCategoryInfo = (category: TagCategory) => {
    return (
      TAG_CATEGORIES.find((cat) => cat.value === category) || TAG_CATEGORIES[5]
    ); // default to custom
  };

  const getTagStats = () => {
    const total = tags.length;
    const active = tags.filter((tag) => tag.isActive).length;
    const inactive = total - active;
    const byCategory = TAG_CATEGORIES.reduce((acc, category) => {
      acc[category.value] = tags.filter(
        (tag) => tag.category === category.value
      ).length;
      return acc;
    }, {} as Record<TagCategory, number>);

    return { total, active, inactive, byCategory };
  };

  const stats = getTagStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-200 dark:bg-gray-700 rounded"
                ></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <TagIcon className="h-8 w-8 mr-3 text-blue-600 dark:text-blue-400" />
                Gestión de Etiquetas
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Administra las etiquetas del sistema de gestión del conocimiento
              </p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="primary"
              className="flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nueva Etiqueta
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <TagIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Total
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <EyeIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Activas
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.active}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                <EyeSlashIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Inactivas
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.inactive}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <FunnelIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Categorías
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {TAG_CATEGORIES.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar etiquetas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Filter Toggle */}
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="secondary"
                className="flex items-center"
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                Filtros
              </Button>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Categoría
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) =>
                        setSelectedCategory(
                          e.target.value as TagCategory | "all"
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="all">Todas las categorías</option>
                      {TAG_CATEGORIES.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Estado
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={showInactiveOnly}
                          onChange={(e) =>
                            setShowInactiveOnly(e.target.checked)
                          }
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Solo inactivas
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tags Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Etiqueta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Uso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTags.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                    >
                      <TagIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                      <p className="text-lg font-medium">
                        No se encontraron etiquetas
                      </p>
                      <p className="text-sm">
                        {searchTerm ||
                        selectedCategory !== "all" ||
                        showInactiveOnly
                          ? "Intenta ajustar los filtros de búsqueda"
                          : "Crea tu primera etiqueta para comenzar"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredTags.map((tag) => {
                    const categoryInfo = getCategoryInfo(tag.category);
                    return (
                      <tr
                        key={tag.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className="w-4 h-4 rounded-full mr-3"
                              style={{ backgroundColor: tag.color }}
                            ></div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {tag.tagName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Creada:{" "}
                                {new Date(tag.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: categoryInfo.color }}
                          >
                            {categoryInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                            {tag.description || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {tag.usageCount} documento
                            {tag.usageCount !== 1 ? "s" : ""}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleStatus(tag)}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              tag.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {tag.isActive ? (
                              <>
                                <EyeIcon className="w-3 h-3 mr-1" />
                                Activa
                              </>
                            ) : (
                              <>
                                <EyeSlashIcon className="w-3 h-3 mr-1" />
                                Inactiva
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditClick(tag)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Editar etiqueta"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(tag)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Eliminar etiqueta"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modales */}
      <TagCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <TagEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTag(null);
        }}
        onSuccess={handleEditSuccess}
        tag={selectedTag}
      />

      <TagDeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedTag(null);
        }}
        onSuccess={handleDeleteSuccess}
        tag={selectedTag}
      />
    </div>
  );
}
