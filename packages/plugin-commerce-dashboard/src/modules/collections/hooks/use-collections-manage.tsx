import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import type { FilterCondition, FilterView } from "@kitejs-cms/core";
import type { FilterConfig } from "@kitejs-cms/dashboard-core/components/filter-modal";
import {
  useApi,
  useBreadcrumb,
  useClipboardTable,
  useDebounce,
  useHasPermission,
  useSettingsContext,
} from "@kitejs-cms/dashboard-core";
import { buildFilterQuery } from "@kitejs-cms/dashboard-core/lib/query-builder";
import {
  COMMERCE_PLUGIN_NAMESPACE,
  COLLECTION_SETTINGS_KEY,
} from "../../../constants";

interface CollectionTranslation {
  title?: string;
  description?: string;
  slug?: string;
}

export type CollectionStatus = "Draft" | "Published" | "Archived";

export interface CollectionListItem {
  id: string;
  status?: CollectionStatus;
  tags?: string[];
  publishAt?: string | null;
  translations: Record<string, CollectionTranslation>;
  updatedAt?: string;
  createdAt?: string;
}

const ITEMS_PER_PAGE = 10;

const STATUS_BADGE_STYLES: Record<CollectionStatus, string> = {
  Draft: "border-yellow-300 bg-yellow-50 text-yellow-800",
  Published: "border-emerald-300 bg-emerald-50 text-emerald-800",
  Archived: "border-slate-300 bg-slate-50 text-slate-800",
};

const isFilterValueEmpty = (value: unknown) => {
  if (value === null || value === undefined || value === "") return true;
  if (Array.isArray(value)) return value.length === 0;
  return false;
};

interface CollectionFilterSettings {
  views?: FilterView[];
}

export function useCollectionsManage() {
  const { t, i18n } = useTranslation("commerce");
  const navigate = useNavigate();
  const { setBreadcrumb } = useBreadcrumb();
  const { copyTable } = useClipboardTable<CollectionListItem>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, loading, error, fetchData, pagination } =
    useApi<CollectionListItem[]>();
  const deleteApi = useApi<unknown>();
  const hasPermission = useHasPermission();
  const { getSetting, updateSetting } = useSettingsContext();

  const [showSearch, setShowSearch] = useState(false);
  const [collectionToDelete, setCollectionToDelete] =
    useState<CollectionListItem | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);
  const [activeView, setActiveView] = useState<FilterView | null>(null);
  const [savedViews, setSavedViews] = useState<FilterView[]>([]);

  const searchQuery = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(searchQuery);
  const debouncedSearch = useDebounce(searchInput, 500);

  const itemsPerPage = ITEMS_PER_PAGE;
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const searchParamsString = searchParams.toString();

  const canCreate = hasPermission("plugin-commerce:collections.create");
  const canUpdate = hasPermission("plugin-commerce:collections.update");
  const canDelete = hasPermission("plugin-commerce:collections.delete");

  const effectiveSearch = useMemo(() => {
    const trimmedSearch = debouncedSearch.trim();
    return trimmedSearch.length >= 3 ? trimmedSearch : "";
  }, [debouncedSearch]);

  const collections = useMemo(() => data ?? [], [data]);

  const closeFilter = useCallback(() => {
    setShowFilter(false);
  }, []);

  const openFilter = useCallback(() => {
    setShowFilter(true);
  }, []);

  const toggleSearch = useCallback(() => {
    setShowSearch((previous) => !previous);
  }, []);

  const statusFilterViews = useMemo<FilterView[]>(() => {
    const statuses: Array<{
      key: "draft" | "published" | "archived";
      value: CollectionStatus;
    }> = [
      { key: "draft", value: "Draft" },
      { key: "published", value: "Published" },
      { key: "archived", value: "Archived" },
    ];

    return statuses.map(({ key, value }) => {
      const name = key.toUpperCase();
      const descriptionKey = `collections.filters.views.${key}.description` as const;
      const descriptionTranslation = t(descriptionKey);

      return {
        id: `status-${key}`,
        name,
        description:
          descriptionTranslation !== descriptionKey
            ? descriptionTranslation
            : undefined,
        conditions: [
          {
            id: `status-${key}`,
            field: "status",
            operator: "equals",
            value,
          },
        ],
      } satisfies FilterView;
    });
  }, [t]);

  const lockedViewIds = useMemo(
    () => statusFilterViews.map((view) => view.id),
    [statusFilterViews]
  );

  useEffect(() => {
    const loadSavedViews = async () => {
      try {
        const settings = await getSetting<{
          value?: CollectionFilterSettings;
        }>(COMMERCE_PLUGIN_NAMESPACE, COLLECTION_SETTINGS_KEY);
        setSavedViews(settings?.value?.views ?? []);
      } catch (loadError) {
        console.error("Failed to load collection filter views", loadError);
      }
    };

    void loadSavedViews();
  }, [getSetting]);

  const combinedViews = useMemo(
    () => [...statusFilterViews, ...savedViews],
    [statusFilterViews, savedViews]
  );

  useEffect(() => {
    if (!activeView) {
      return;
    }

    const updatedView = combinedViews.find((view) => view.id === activeView.id);
    if (
      updatedView &&
      (updatedView.name !== activeView.name ||
        updatedView.description !== activeView.description)
    ) {
      setActiveView(updatedView);
    }
  }, [activeView, combinedViews]);

  const filterConfig = useMemo<FilterConfig>(
    () => ({
      fields: [
        {
          key: "status",
          label: t("collections.filters.fields.status"),
          type: "select",
          options: [
            { value: "Draft", label: t("collections.status.Draft") },
            { value: "Published", label: t("collections.status.Published") },
            { value: "Archived", label: t("collections.status.Archived") },
          ],
        },
        {
          key: "tags",
          label: t("collections.filters.fields.tags"),
          type: "array",
        },
        {
          key: "publishAt",
          label: t("collections.filters.fields.publishAt"),
          type: "date",
        },
        {
          key: "expireAt",
          label: t("collections.filters.fields.expireAt"),
          type: "date",
        },
        {
          key: "createdAt",
          label: t("collections.filters.fields.createdAt"),
          type: "date",
        },
      ],
      views: combinedViews,
      allowSaveViews: true,
      lockedViewIds,
    }),
    [combinedViews, lockedViewIds, t]
  );

  useEffect(() => {
    setBreadcrumb([
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.collections"), path: "/commerce/collections" },
    ]);
  }, [setBreadcrumb, t]);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const apiQueryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page[number]", currentPage.toString());
    params.set("page[size]", itemsPerPage.toString());
    if (effectiveSearch) {
      params.set("search", effectiveSearch);
    }
    if (activeFilters.length > 0) {
      const filterQuery = buildFilterQuery(activeFilters);
      Object.entries(filterQuery).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          return;
        }
        if (Array.isArray(value)) {
          if (value.length > 0) {
            params.set(key, value.join(","));
          }
        } else if (typeof value === "boolean") {
          params.set(key, value ? "true" : "false");
        } else {
          params.set(key, String(value));
        }
      });
    }

    return params.toString();
  }, [activeFilters, currentPage, effectiveSearch, itemsPerPage]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", currentPage.toString());
    if (effectiveSearch) {
      params.set("search", effectiveSearch);
    }
    const newParams = params.toString();
    if (searchParamsString !== newParams) {
      setSearchParams(params, { replace: true });
    }

    void fetchData(`commerce/collections?${apiQueryString}`);
  }, [
    apiQueryString,
    currentPage,
    effectiveSearch,
    fetchData,
    searchParamsString,
    setSearchParams,
  ]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (currentPage !== 1) {
        const params = new URLSearchParams(searchParams);
        params.set("page", "1");
        setSearchParams(params);
      }
    },
    [currentPage, searchParams, setSearchParams]
  );

  const handleApplyFilters = useCallback(
    (filters: FilterCondition[]) => {
      setActiveFilters(filters);
      setActiveView(null);
      closeFilter();

      if (currentPage !== 1) {
        const params = new URLSearchParams(searchParams);
        params.set("page", "1");
        setSearchParams(params);
      }
    },
    [closeFilter, currentPage, searchParams, setSearchParams]
  );

  const handleLoadView = useCallback(
    (view: FilterView) => {
      setActiveFilters(
        view.conditions.map((condition) => ({
          ...condition,
          value: Array.isArray(condition.value)
            ? [...condition.value]
            : condition.value,
        }))
      );
      setActiveView(view);
      closeFilter();

      const params = new URLSearchParams(searchParams);
      params.set("page", "1");
      setSearchParams(params);
    },
    [closeFilter, searchParams, setSearchParams]
  );

  const handleSaveView = useCallback(
    async (view: FilterView) => {
      const nextViews = [...savedViews, view];

      try {
        await updateSetting(COMMERCE_PLUGIN_NAMESPACE, COLLECTION_SETTINGS_KEY, {
          views: nextViews,
        });
        setSavedViews(nextViews);
        toast.success(t("collections.filters.toasts.viewSaved.title"), {
          description: t("collections.filters.toasts.viewSaved.description", {
            name: view.name,
          }),
        });
      } catch (saveError) {
        console.error("Failed to save collection filter view", saveError);
        toast.error(t("collections.filters.toasts.viewSaveError"));
      }
    },
    [savedViews, t, updateSetting]
  );

  const handleDeleteView = useCallback(
    async (viewId: string) => {
      const viewToDelete = savedViews.find((view) => view.id === viewId);
      if (!viewToDelete) {
        return;
      }

      const nextViews = savedViews.filter((view) => view.id !== viewId);

      try {
        await updateSetting(COMMERCE_PLUGIN_NAMESPACE, COLLECTION_SETTINGS_KEY, {
          views: nextViews,
        });
        setSavedViews(nextViews);

        if (activeView?.id === viewId) {
          setActiveView(null);
          setActiveFilters([]);
        }

        toast.success(t("collections.filters.toasts.viewDeleted.title"), {
          description: t("collections.filters.toasts.viewDeleted.description", {
            name: viewToDelete.name,
          }),
        });
      } catch (deleteError) {
        console.error("Failed to delete collection filter view", deleteError);
        toast.error(t("collections.filters.toasts.viewDeleteError"));
      }
    },
    [activeView, savedViews, t, updateSetting]
  );

  const handleClearFilters = useCallback(() => {
    setActiveFilters([]);
    setActiveView(null);
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams);
      params.set("page", page.toString());
      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  const handleRowClick = useCallback(
    (id: string) => {
      navigate(`/commerce/collections/${id}`);
    },
    [navigate]
  );

  const handleCreate = useCallback(() => {
    navigate("/commerce/collections/new");
  }, [navigate]);

  const requestDelete = useCallback((collection: CollectionListItem) => {
    setCollectionToDelete(collection);
  }, []);

  const cancelDelete = useCallback(() => {
    setCollectionToDelete(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!collectionToDelete) return;
    const { error: deleteError } = await deleteApi.fetchData(
      `commerce/collections/${collectionToDelete.id}`,
      "DELETE"
    );
    if (!deleteError) {
      setCollectionToDelete(null);
      await fetchData(`commerce/collections?${apiQueryString}`);
    }
  }, [apiQueryString, collectionToDelete, deleteApi, fetchData]);

  const getCollectionTitle = useCallback(
    (collection: CollectionListItem) => {
      const translation =
        collection.translations?.[i18n.language] ?? collection.translations?.en;
      if (translation?.title && translation.title.trim().length > 0) {
        return translation.title;
      }
      return t("collections.table.untitled");
    },
    [i18n.language, t]
  );

  const getStatusLabel = useCallback(
    (status?: CollectionStatus) => {
      if (!status) return "-";
      return t(`collections.status.${status}` as const);
    },
    [t]
  );

  const formatDate = useCallback(
    (value?: string) => {
      if (!value) return "-";
      try {
        return new Intl.DateTimeFormat(i18n.language, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(value));
      } catch {
        return value;
      }
    },
    [i18n.language]
  );

  const handleCopy = useCallback(() => {
    if (!collections.length) return;
    const dataset = collections.map((row) => ({
      ...row,
      titleForClipboard: getCollectionTitle(row),
      languagesForClipboard: Object.keys(row.translations).join(", "),
      tagsForClipboard: row.tags?.length ? row.tags.join(", ") : "-",
      statusForClipboard: getStatusLabel(row.status),
      publishAtForClipboard: row.publishAt
        ? new Date(row.publishAt).toISOString()
        : "-",
    }));

    copyTable(dataset, [
      { key: "titleForClipboard", label: t("collections.fields.title") },
      { key: "languagesForClipboard", label: t("collections.fields.languages") },
      { key: "tagsForClipboard", label: t("collections.fields.tags") },
      { key: "statusForClipboard", label: t("collections.fields.status") },
      { key: "publishAtForClipboard", label: t("collections.fields.publishAt") },
    ]);
  }, [collections, copyTable, getCollectionTitle, getStatusLabel, t]);

  const activeFilterCount = activeFilters.filter(
    (filter) => !isFilterValueEmpty(filter.value)
  ).length;
  const hasActiveFilters = activeFilterCount > 0;

  return {
    t,
    collections,
    loading,
    error,
    pagination,
    showSearch,
    toggleSearch,
    searchInput,
    handleSearchChange,
    showFilter,
    openFilter,
    closeFilter,
    filterConfig,
    activeFilters,
    activeFilterCount,
    hasActiveFilters,
    activeView,
    handleApplyFilters,
    handleLoadView,
    handleSaveView,
    handleDeleteView,
    handleClearFilters,
    canCreate,
    canUpdate,
    canDelete,
    handleCopy,
    handlePageChange,
    handleRowClick,
    handleCreate,
    requestDelete,
    cancelDelete,
    confirmDelete,
    deleteLoading: deleteApi.loading,
    collectionToDelete,
    getCollectionTitle,
    getStatusLabel,
    statusBadgeStyles: STATUS_BADGE_STYLES,
    formatDate,
  };
}
