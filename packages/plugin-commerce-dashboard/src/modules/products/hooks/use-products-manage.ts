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
  PRODUCT_SETTINGS_KEY,
} from "../../../constants";

export type ProductStatus = "draft" | "active" | "archived";

export interface ProductListItem {
  id: string;
  status?: ProductStatus;
  tags?: string[];
  publishAt?: string | null;
  expireAt?: string | null;
  translations: Record<string, Record<string, unknown>>;
  updatedAt?: string;
  createdAt?: string;
}

const ITEMS_PER_PAGE = 10;

const STATUS_BADGE_STYLES = {
  draft: "border-yellow-700 bg-yellow-50 text-yellow-800",
  Draft: "border-yellow-700 bg-yellow-50 text-yellow-800",
  active: "border-green-700 bg-green-50 text-green-800",
  Active: "border-green-700 bg-green-50 text-green-800",
  published: "border-green-700 bg-green-50 text-green-800",
  Published: "border-green-700 bg-green-50 text-green-800",
  archived: "border-red-700 bg-red-50 text-red-800",
  Archived: "border-red-700 bg-red-50 text-red-800",
} as const satisfies Record<string, string>;

const isFilterValueEmpty = (value: unknown) => {
  if (value === null || value === undefined || value === "") return true;
  if (Array.isArray(value)) return value.length === 0;
  return false;
};

interface ProductFilterSettings {
  views?: FilterView[];
}

export function useProductsManage() {
  const { t, i18n } = useTranslation("commerce");
  const navigate = useNavigate();
  const { setBreadcrumb } = useBreadcrumb();
  const { copyTable } = useClipboardTable<ProductListItem>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, loading, error, fetchData, pagination } =
    useApi<ProductListItem[]>();
  const deleteApi = useApi<unknown>();
  const hasPermission = useHasPermission();
  const { getSetting, updateSetting } = useSettingsContext();

  const [showSearch, setShowSearch] = useState(false);
  const [productToDelete, setProductToDelete] =
    useState<ProductListItem | null>(null);
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

  const canCreate = hasPermission("plugin-commerce:products.create");
  const canUpdate = hasPermission("plugin-commerce:products.update");
  const canDelete = hasPermission("plugin-commerce:products.delete");

  const effectiveSearch = useMemo(() => {
    const trimmedSearch = debouncedSearch.trim();
    return trimmedSearch.length >= 3 ? trimmedSearch : "";
  }, [debouncedSearch]);

  const products = useMemo(() => data ?? [], [data]);

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
    const statuses: ProductStatus[] = ["draft", "active", "archived"];

    return statuses.map((key) => {
      const descriptionKey =
        `products.filters.views.${key}.description` as const;
      const descriptionTranslation = t(descriptionKey);

      return {
        id: `status-${key}`,
        name: key.toUpperCase(),
        description:
          descriptionTranslation !== descriptionKey
            ? descriptionTranslation
            : undefined,
        conditions: [
          {
            id: `status-${key}`,
            field: "status",
            operator: "equals",
            value: key,
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
          value?: ProductFilterSettings;
        }>(COMMERCE_PLUGIN_NAMESPACE, PRODUCT_SETTINGS_KEY);
        setSavedViews(settings?.value?.views ?? []);
      } catch (loadError) {
        console.error("Failed to load product filter views", loadError);
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
          label: t("products.filters.fields.status"),
          type: "select",
          options: [
            { value: "draft", label: t("products.status.draft") },
            { value: "active", label: t("products.status.active") },
            { value: "archived", label: t("products.status.archived") },
          ],
        },
        {
          key: "tags",
          label: t("products.filters.fields.tags"),
          type: "array",
        },
        {
          key: "publishAt",
          label: t("products.filters.fields.publishAt"),
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
      { label: t("breadcrumb.products"), path: "/commerce/products" },
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

    void fetchData(`commerce/products?${apiQueryString}`);
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
        await updateSetting(COMMERCE_PLUGIN_NAMESPACE, PRODUCT_SETTINGS_KEY, {
          views: nextViews,
        });
        setSavedViews(nextViews);
        toast.success(t("products.filters.toasts.viewSaved.title"), {
          description: t("products.filters.toasts.viewSaved.description", {
            name: view.name,
          }),
        });
      } catch (saveError) {
        console.error("Failed to save product filter view", saveError);
        toast.error(t("products.filters.toasts.viewSaveError"));
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
        await updateSetting(COMMERCE_PLUGIN_NAMESPACE, PRODUCT_SETTINGS_KEY, {
          views: nextViews,
        });
        setSavedViews(nextViews);

        if (activeView?.id === viewId) {
          setActiveView(null);
          setActiveFilters([]);
        }

        toast.success(t("products.filters.toasts.viewDeleted.title"), {
          description: t("products.filters.toasts.viewDeleted.description", {
            name: viewToDelete.name,
          }),
        });
      } catch (deleteError) {
        console.error("Failed to delete product filter view", deleteError);
        toast.error(t("products.filters.toasts.viewDeleteError"));
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
      navigate(`/commerce/products/${id}`);
    },
    [navigate]
  );

  const handleCreate = useCallback(() => {
    navigate("/commerce/products/create");
  }, [navigate]);

  const requestDelete = useCallback((product: ProductListItem) => {
    setProductToDelete(product);
  }, []);

  const cancelDelete = useCallback(() => {
    setProductToDelete(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!productToDelete) return;
    const { error: deleteError } = await deleteApi.fetchData(
      `commerce/products/${productToDelete.id}`,
      "DELETE"
    );
    if (!deleteError) {
      setProductToDelete(null);
      await fetchData(`commerce/products?${apiQueryString}`);
    }
  }, [apiQueryString, deleteApi, fetchData, productToDelete]);

  const getProductTitle = useCallback(
    (product: ProductListItem) => {
      const language = i18n.language.split("-")[0];
      const translation =
        product.translations?.[language] ?? product.translations[0];
      if (
        translation &&
        typeof translation.title === "string" &&
        translation.title.trim().length > 0
      ) {
        return translation.title as string;
      }
      return t("products.table.untitled");
    },
    [i18n.language, t]
  );

  const getStatusLabel = useCallback(
    (status?: string) => {
      if (!status) return "-";
      const normalized = status.toLowerCase();
      const key = `products.status.${normalized}`;
      const label = t(key, { defaultValue: status });
      return label;
    },
    [t]
  );

  const formatDate = useCallback(
    (value?: string | null) => {
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
    if (!products.length) return;
    const dataset = products.map((row) => ({
      ...row,
      titleForClipboard: getProductTitle(row),
      languagesForClipboard: Object.keys(row.translations).join(", "),
      tagsForClipboard: row.tags?.length ? row.tags.join(", ") : "-",
      statusForClipboard: getStatusLabel(row.status),
      publishAtForClipboard: row.publishAt
        ? new Date(row.publishAt).toISOString()
        : "-",
      updatedAtForClipboard: row.updatedAt
        ? new Date(row.updatedAt).toISOString()
        : "-",
    }));

    copyTable(dataset, [
      { key: "titleForClipboard", label: t("products.fields.title") },
      {
        key: "languagesForClipboard",
        label: t("products.fields.languages"),
      },
      { key: "tagsForClipboard", label: t("products.fields.tags") },
      { key: "statusForClipboard", label: t("products.fields.status") },
      {
        key: "publishAtForClipboard",
        label: t("products.fields.publishAt"),
      },
      {
        key: "updatedAtForClipboard",
        label: t("products.fields.updatedAt"),
      },
    ]);
  }, [copyTable, getProductTitle, getStatusLabel, products, t]);

  const activeFilterCount = activeFilters.filter(
    (filter) => !isFilterValueEmpty(filter.value)
  ).length;
  const hasActiveFilters = activeFilterCount > 0;

  return {
    t,
    products,
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
    productToDelete,
    getProductTitle,
    getStatusLabel,
    statusBadgeStyles: STATUS_BADGE_STYLES,
    formatDate,
  };
}
