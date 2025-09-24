import { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate } from "react-router-dom";
import { DataTable } from "@kitejs-cms/dashboard-core/components/data-table";
import { buildFilterQuery } from "@kitejs-cms/dashboard-core/lib/query-builder";
import type { FilterConfig } from "@kitejs-cms/dashboard-core/components/filter-modal";
import { StatusBadge } from "../components/status-badge";
import { DeleteDialog } from "../components/delete-dialog";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Badge,
  Separator,
  useApi,
  useClipboardTable,
  useDebounce,
  useBreadcrumb,
  useHasPermission,
  FilterModal,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  LanguagesBadge,
} from "@kitejs-cms/dashboard-core";
import {
  MoreVertical,
  Edit,
  Clipboard,
  Download,
  Search,
  Plus,
  ListFilter,
  Trash,
} from "lucide-react";

interface Gallery {
  id: string;
  status: string;
  tags?: string[];
  publishAt?: string;
  translations: Record<string, { title?: string }>;
}

type FilterOperator =
  | "equals"
  | "ne"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "nin"
  | "contains"
  | "startswith"
  | "endswith"
  | "exists"
  | "regex";

interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: unknown;
}

export function GalleriesManagePage() {
  const { t, i18n } = useTranslation("gallery");
  const navigate = useNavigate();
  const { setBreadcrumb } = useBreadcrumb();
  const { copyTable } = useClipboardTable<{
    title: string;
    tags: string;
    languages: string;
    status: string;
    publishAt: string;
  }>();
  const { data, loading, fetchData, pagination } = useApi<Gallery[]>();
  const hasPermission = useHasPermission();
  const canCreate = hasPermission("gallery-plugin:galleries.create");
  const canUpdate = hasPermission("gallery-plugin:galleries.update");
  const canDelete = hasPermission("gallery-plugin:galleries.delete");

  const [showFilter, setShowFilter] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState("");
  const [selectedForDelete, setSelectedForDelete] = useState<Gallery | null>(
    null
  );
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);

  const debouncedSearchInput = useDebounce(searchInput, 500);

  const itemsPerPage = 15;
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const searchQuery = searchParams.get("search") || "";

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setBreadcrumb([
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.galleries"), path: "/galleries" },
    ]);
  }, [setBreadcrumb, t]);

  const filterConfig = useMemo<FilterConfig>(
    () => ({
      fields: [
        {
          key: "status",
          label: t("fields.status"),
          type: "select" as const,
          options: [
            { value: "Draft", label: t("status.draft") },
            { value: "Published", label: t("status.published") },
            { value: "Archived", label: t("status.archived") },
          ],
        },
        {
          key: "tags",
          label: t("fields.tags"),
          type: "array" as const,
        },
      ],
    }),
    [t]
  );

  const buildApiUrl = useCallback(
    (page: number, search: string, filters: FilterCondition[] = []) => {
      const params = new URLSearchParams();
      params.set("page[number]", page.toString());
      params.set("page[size]", itemsPerPage.toString());
      if (search && search.length >= 3) {
        params.set("search", search);
      }
      if (filters.length > 0) {
        const filterQuery = buildFilterQuery(filters);
        Object.entries(filterQuery).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            params.set(key, value.join(","));
          } else {
            params.set(key, String(value));
          }
        });
      }
      return `galleries?${params.toString()}`;
    },
    [itemsPerPage]
  );

  useEffect(() => {
    const effectiveSearch =
      debouncedSearchInput.length >= 3 ? debouncedSearchInput : "";
    const params = new URLSearchParams();
    params.set("page", currentPage.toString());
    if (effectiveSearch) {
      params.set("search", effectiveSearch);
    }
    setSearchParams(params, { replace: true });
    fetchData(buildApiUrl(currentPage, effectiveSearch, activeFilters));
  }, [
    debouncedSearchInput,
    currentPage,
    fetchData,
    setSearchParams,
    buildApiUrl,
    activeFilters,
  ]);

  const handlePageChange = (page: number) => {
    const effectiveSearch = searchInput.length >= 3 ? searchInput : "";
    fetchData(buildApiUrl(page, effectiveSearch, activeFilters));
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    if (effectiveSearch) params.set("search", effectiveSearch);
    setSearchParams(params);
  };

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
    if (currentPage !== 1) {
      const params = new URLSearchParams(searchParams);
      params.set("page", "1");
      setSearchParams(params);
    }
  };

  const handleCopy = () => {
    if (!data) return;
    const formatted = data.map((g) => ({
      title: renderTitle(g.translations),
      tags: (g.tags || []).join(", "),
      languages: Object.keys(g.translations).join(", "),
      status: g.status,
      publishAt: g.publishAt || "",
    }));
    copyTable(formatted, [
      { key: "title", label: t("fields.title") },
      { key: "tags", label: t("fields.tags") },
      { key: "languages", label: t("fields.languages") },
      { key: "status", label: t("fields.status") },
      { key: "publishAt", label: t("fields.publishAt") },
    ]);
  };

  const renderTitle = (
    translations: Record<string, { title?: string }>
  ): string => {
    const lang = i18n.language;
    if (translations[lang]?.title) {
      return translations[lang].title!;
    }
    const first = Object.values(translations)[0];
    return first?.title || "";
  };

  const renderTags = (tags: string[] = []) => {
    const maxShow = 2;
    const visible = tags.slice(0, maxShow);
    const extra = tags.length - maxShow;
    return (
      <div className="flex items-center gap-1">
        {visible.map((tag, key) => (
          <Badge
            key={key}
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

  const handleDelete = async () => {
    if (!selectedForDelete) return;
    const { data } = await fetchData(
      `galleries/${selectedForDelete.id}`,
      "DELETE"
    );
    if (data) {
      setSelectedForDelete(null);
      fetchData(buildApiUrl(currentPage, searchInput, activeFilters));
    }
  };

  const hasActiveFilters = activeFilters.length > 0;
  const activeFilterCount = activeFilters.length;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full shadow-neutral-50 gap-0 py-0">
        <CardHeader className="bg-secondary text-primary py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <CardTitle>{t("title.manageGalleries")}</CardTitle>
              {hasActiveFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 text-xs"
                  >
                    {t("filters.active").replace(
                      "{count}",
                      activeFilterCount.toString()
                    )}
                  </Badge>
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
                className="cursor-pointer shadow-none bg-neutral-100"
                onClick={() => setShowSearch(!showSearch)}
              >
                <Search className="h-4 w-4 text-neutral-500" />
              </Button>
              {showSearch && (
                <div className="transform transition-all duration-500 ease-in-out origin-right">
                  <Input
                    type="text"
                    placeholder={t("search.placeholder") as string}
                    className="w-[200px] animate-in fade-in slide-in-from-right-1 duration-300 bg-white shadow-muted"
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                  {searchInput.length > 0 && searchInput.length < 3 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("search.minChars")}
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
                      onClick={() => navigate(`/galleries/create`)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t("buttons.addGallery")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleCopy}>
                    <Clipboard className="mr-2 h-4 w-4" />
                    {t("buttons.copy")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {}}>
                    <Download className="mr-2 h-4 w-4" />
                    {t("buttons.download")}
                  </DropdownMenuItem>
                  {hasActiveFilters && (
                    <DropdownMenuItem
                      onClick={() => {
                        setActiveFilters([]);
                      }}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      {t("buttons.clearFilters")}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0 text-sm">
          <DataTable<Gallery>
            data={data}
            isLoading={loading}
            columns={[
              {
                key: "title" as never,
                label: t("fields.title"),
                render: (_, row) => renderTitle(row.translations),
              },
              {
                key: "status",
                label: t("fields.status"),
                render: (v) => <StatusBadge status={v as string} />,
              },
              {
                key: "translations",
                label: t("fields.languages"),
                render: (_, row) => LanguagesBadge(row.translations),
              },
              {
                key: "tags",
                label: t("fields.tags"),
                render: (_, row) => renderTags(row.tags || []),
              },
              {
                key: "publishAt",
                label: t("fields.publishAt"),
                render: (v) =>
                  v
                    ? new Intl.DateTimeFormat("it-IT", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(v as string))
                    : "",
              },
              {
                key: "id",
                label: t("fields.actions"),
                render: (_, row) => {
                  if (!canUpdate && !canDelete) return null;
                  return (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="shadow-none"
                        >
                          <MoreVertical />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canUpdate && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/galleries/${row.id}`);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            {t("buttons.edit")}
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedForDelete(row);
                            }}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            {t("buttons.delete")}
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
              onPageChange: handlePageChange,
            }}
            onRowClick={(row) => navigate(`/galleries/${row.id}`)}
          />
        </CardContent>
      </Card>
      <DeleteDialog
        isOpen={!!selectedForDelete}
        onClose={() => setSelectedForDelete(null)}
        onDelete={handleDelete}
        name={
          selectedForDelete ? renderTitle(selectedForDelete.translations) : ""
        }
      />
      <FilterModal
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        config={filterConfig}
        onApplyFilters={handleApplyFilters}
        initialConditions={activeFilters}
      />
    </div>
  );
}
