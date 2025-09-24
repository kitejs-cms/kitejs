import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  LanguagesBadge,
  FilterModal,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Separator,
  useApi,
  useBreadcrumb,
  useClipboardTable,
  useHasPermission,
  useDebounce,
  useSettingsContext,
} from "@kitejs-cms/dashboard-core";
import {
  Clipboard,
  Download,
  Edit,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  ListFilter,
  Trash,
} from "lucide-react";
import type { FilterCondition, FilterView } from "@kitejs-cms/core";
import type { FilterConfig } from "@kitejs-cms/dashboard-core/components/filter-modal";
import { buildFilterQuery } from "@kitejs-cms/dashboard-core/lib/query-builder";
import { toast } from "sonner";
import {
  COMMERCE_PLUGIN_NAMESPACE,
  COLLECTION_SETTINGS_KEY,
} from "../../../constants";

interface CollectionTranslation {
  title?: string;
  description?: string;
  slug?: string;
}

type CollectionStatus = "Draft" | "Published" | "Archived";

interface CollectionListItem {
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

export function CommerceCollectionsPage() {
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
  const [searchInput, setSearchInput] = useState("");
  const [activeView, setActiveView] = useState<FilterView | null>(null);
  const [savedViews, setSavedViews] = useState<FilterView[]>([]);

  const itemsPerPage = ITEMS_PER_PAGE;
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const searchQuery = searchParams.get("search") || "";
  const debouncedSearch = useDebounce(searchInput, 500);
  const searchParamsString = searchParams.toString();

  const canCreate = hasPermission("plugin-commerce:collections.create");
  const canUpdate = hasPermission("plugin-commerce:collections.update");
  const canDelete = hasPermission("plugin-commerce:collections.delete");

  const statusFilterViews = useMemo<FilterView[]>(() => {
    const statuses: Array<{ key: "draft" | "published" | "archived"; value: CollectionStatus }> = [
      { key: "draft", value: "Draft" },
      { key: "published", value: "Published" },
      { key: "archived", value: "Archived" },
    ];

    return statuses.map(({ key, value }) => {
      const name = t(`collections.filters.views.${key}.name`);
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
      } catch (error) {
        console.error("Failed to load collection filter views", error);
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

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", currentPage.toString());
    const trimmedSearch = debouncedSearch.trim();
    const effectiveSearch = trimmedSearch.length >= 3 ? trimmedSearch : "";
    if (effectiveSearch) params.set("search", effectiveSearch);

    const currentParams = searchParamsString;
    const newParams = params.toString();
    if (currentParams !== newParams) {
      setSearchParams(params, { replace: true });
    }

    const apiParams = new URLSearchParams();
    apiParams.set("page[number]", currentPage.toString());
    apiParams.set("page[size]", itemsPerPage.toString());
    if (effectiveSearch) {
      apiParams.set("search", effectiveSearch);
    }
    if (activeFilters.length > 0) {
      const filterQuery = buildFilterQuery(activeFilters);
      Object.entries(filterQuery).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          return;
        }
        if (Array.isArray(value)) {
          if (value.length > 0) {
            apiParams.set(key, value.join(","));
          }
        } else if (typeof value === "boolean") {
          apiParams.set(key, value ? "true" : "false");
        } else {
          apiParams.set(key, String(value));
        }
      });
    }

    void fetchData(`commerce/collections?${apiParams.toString()}`);
  }, [
    activeFilters,
    currentPage,
    debouncedSearch,
    fetchData,
    itemsPerPage,
    searchParamsString,
    setSearchParams,
  ]);

  const collections = data ?? [];

  const handleCopy = () => {
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
  };

  const getCollectionTitle = (collection: CollectionListItem) => {
    const translation =
      collection.translations?.[i18n.language] ?? collection.translations?.en;
    if (translation?.title && translation.title.trim().length > 0) {
      return translation.title;
    }
    return t("collections.table.untitled");
  };

  const getStatusLabel = (status?: CollectionStatus) => {
    if (!status) return "-";
    return t(`collections.status.${status}` as const);
  };

  const renderTags = (tags: string[] | undefined) => {
    if (!tags || tags.length === 0) {
      return <span className="text-muted-foreground">-</span>;
    }

    const maxShow = 2;
    const visible = tags.slice(0, maxShow);
    const extra = tags.length - maxShow;

    return (
      <div className="flex items-center gap-1">
        {visible.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="border-gray-200 bg-gray-50 font-normal"
          >
            {tag}
          </Badge>
        ))}
        {extra > 0 && (
          <Badge
            variant="outline"
            className="border-gray-200 bg-gray-50 font-normal"
          >
            +{extra}
          </Badge>
        )}
      </div>
    );
  };

  const renderStatus = (status?: CollectionStatus) => {
    if (!status) {
      return <span className="text-muted-foreground">-</span>;
    }

    return (
      <Badge
        variant="outline"
        className={`${STATUS_BADGE_STYLES[status]} font-normal`}
      >
        {getStatusLabel(status)}
      </Badge>
    );
  };

  const formatDate = useMemo(
    () =>
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

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (currentPage !== 1) {
      const params = new URLSearchParams(searchParams);
      params.set("page", "1");
      setSearchParams(params);
    }
  };

  const handleApplyFilters = (filters: FilterCondition[]) => {
    setActiveFilters(filters);
    setActiveView(null);
    setShowFilter(false);

    if (currentPage !== 1) {
      const params = new URLSearchParams(searchParams);
      params.set("page", "1");
      setSearchParams(params);
    }
  };

  const handleLoadView = (view: FilterView) => {
    setActiveFilters(
      view.conditions.map((condition) => ({
        ...condition,
        value: Array.isArray(condition.value)
          ? [...condition.value]
          : condition.value,
      }))
    );
    setActiveView(view);
    setShowFilter(false);

    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    setSearchParams(params);
  };

  const handleSaveView = async (view: FilterView) => {
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
    } catch (error) {
      console.error("Failed to save collection filter view", error);
      toast.error(t("collections.filters.toasts.viewSaveError"));
    }
  };

  const handleDeleteView = async (viewId: string) => {
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
    } catch (error) {
      console.error("Failed to delete collection filter view", error);
      toast.error(t("collections.filters.toasts.viewDeleteError"));
    }
  };

  const handleClearFilters = () => {
    setActiveFilters([]);
    setActiveView(null);
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    setSearchParams(params);
  };

  const activeFilterCount = activeFilters.filter(
    (filter) => !isFilterValueEmpty(filter.value)
  ).length;
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full gap-0 py-0 shadow-neutral-50">
        <CardHeader className="rounded-t-xl bg-secondary py-4 text-primary">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <CardTitle>{t("collections.title.manage")}</CardTitle>
              {(hasActiveFilters || activeView) && (
                <div className="flex flex-wrap items-center gap-2">
                  {hasActiveFilters && (
                    <Badge
                      variant="secondary"
                      className="w-fit bg-blue-100 text-blue-800"
                    >
                      {t("collections.filters.active", {
                        count: activeFilterCount,
                      })}
                    </Badge>
                  )}
                  {activeView && (
                    <Badge
                      variant="outline"
                      className="w-fit border-green-300 bg-green-100 text-green-800"
                    >
                      {t("collections.filters.activeView", {
                        name: activeView.name,
                      })}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={hasActiveFilters ? "default" : "outline"}
                size="icon"
                className="cursor-pointer shadow-none"
                onClick={() => setShowFilter(true)}
              >
                <ListFilter className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="cursor-pointer bg-neutral-100 shadow-none"
                onClick={() => setShowSearch(!showSearch)}
              >
                <Search className="h-4 w-4 text-neutral-500" />
              </Button>
              {showSearch && (
                <div className="origin-right transform transition-all duration-500 ease-in-out">
                  <Input
                    type="text"
                    placeholder={t("collections.search.placeholder")}
                    className="w-[200px] animate-in fade-in slide-in-from-right-1 duration-300 bg-white shadow-muted"
                    value={searchInput}
                    onChange={(event) => handleSearchChange(event.target.value)}
                  />
                  {searchInput.length > 0 && searchInput.trim().length < 3 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("collections.search.minLength")}
                    </p>
                  )}
                </div>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canCreate && (
                    <DropdownMenuItem
                      onClick={() => navigate("/commerce/collections/new")}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t("collections.buttons.add")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleCopy}>
                    <Clipboard className="mr-2 h-4 w-4" />
                    {t("collections.buttons.copy")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => console.log(t("collections.buttons.download"))}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {t("collections.buttons.download")}
                  </DropdownMenuItem>
                  {hasActiveFilters && (
                    <DropdownMenuItem onClick={handleClearFilters}>
                      <Trash className="mr-2 h-4 w-4" />
                      {t("collections.filters.clear")}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0 text-sm">
          {error && (
            <div className="px-4 py-3 text-sm text-destructive">
              {t("collections.table.error")}
            </div>
          )}
          <DataTable<CollectionListItem>
            data={collections}
            isLoading={loading}
            columns={[
              {
                key: "translations" as never,
                label: t("collections.fields.title"),
                render: (_, row) => getCollectionTitle(row),
              },
              {
                key: "status" as never,
                label: t("collections.fields.status"),
                render: (_, row) => renderStatus(row.status),
              },
              {
                key: "translations" as never,
                label: t("collections.fields.languages"),
                render: (_, row) => LanguagesBadge(row.translations),
              },
              {
                key: "tags" as never,
                label: t("collections.fields.tags"),
                render: (_, row) => renderTags(row.tags),
              },
              {
                key: "publishAt" as never,
                label: t("collections.fields.publishAt"),
                render: (value) => formatDate(value as string | undefined),
              },
              {
                key: "updatedAt" as never,
                label: t("collections.fields.updatedAt"),
                render: (value) => formatDate(value as string | undefined),
              },
              {
                key: "id" as never,
                label: t("collections.fields.actions"),
                render: (_, row) => {
                  if (!canUpdate && !canDelete) return null;
                  return (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="shadow-none">
                          <MoreVertical />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canUpdate && (
                          <DropdownMenuItem
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/commerce/collections/${row.id}`);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            {t("collections.buttons.edit")}
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <DropdownMenuItem
                            onClick={(event) => {
                              event.stopPropagation();
                              setCollectionToDelete(row);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("collections.buttons.delete")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                },
              },
            ]}
            pagination={{
              currentPage: pagination?.currentPage,
              totalPages: pagination?.totalPages,
              onPageChange: (page) => {
                const params = new URLSearchParams(searchParams);
                params.set("page", page.toString());
                setSearchParams(params);
              },
            }}
            onRowClick={(row) => navigate(`/commerce/collections/${row.id}`)}
            emptyMessage={t("collections.table.empty")}
          />
        </CardContent>
      </Card>

      <AlertDialog
        open={collectionToDelete !== null}
        onOpenChange={(open) => !open && setCollectionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("collections.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("collections.delete.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("collections.delete.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!collectionToDelete) return;
                const { error: deleteError } = await deleteApi.fetchData(
                  `commerce/collections/${collectionToDelete.id}`,
                  "DELETE"
                );
                if (!deleteError) {
                  setCollectionToDelete(null);
                  const params = new URLSearchParams();
                  params.set("page[number]", currentPage.toString());
                  params.set("page[size]", itemsPerPage.toString());
                  const trimmedSearch = debouncedSearch.trim();
                  const effectiveSearch =
                    trimmedSearch.length >= 3 ? trimmedSearch : "";
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
                  void fetchData(`commerce/collections?${params.toString()}`);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteApi.loading}
            >
              {t("collections.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FilterModal
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        config={filterConfig}
        initialConditions={activeFilters}
        onApplyFilters={handleApplyFilters}
        onLoadView={handleLoadView}
        onSaveView={handleSaveView}
        onDeleteView={handleDeleteView}
      />
    </div>
  );
}
