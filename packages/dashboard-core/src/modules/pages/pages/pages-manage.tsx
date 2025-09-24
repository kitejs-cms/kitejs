import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useBreadcrumb } from "../../../context/breadcrumb-context";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { useClipboardTable } from "../../../hooks/use-clipboard-table";
import { Separator } from "../../../components/ui/separator";
import { DataTable } from "../../../components/data-table";
import { useApi } from "../../../hooks/use-api";
import { useHasPermission } from "../../../hooks/use-has-permission";
import {
  ArticleSettingsModel,
  type FilterCondition,
  type FilterView,
  type PageResponseDetailsModel,
} from "@kitejs-cms/core/index";
import { StatusBadge } from "../components/status-badge";
import { useDebounce } from "../../../hooks/use-debounce";
import { DeleteDialog } from "../components/delete-dialog";
import { FilterModal } from "../../../components/filter-modal";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import {
  MoreVertical,
  Edit,
  Code,
  Clipboard,
  Download,
  Search,
  Plus,
  LayoutTemplate,
  Trash,
  ListFilter,
} from "lucide-react";
import { useSettingsContext } from "../../../context/settings-context";
import { buildFilterQuery } from "../../../lib/query-builder";
import { LanguagesBadge } from "../../../components/languages-badge";

export type Props = { pageType?: "Post" | "Page" };

export function PagesManagePage({ pageType = "Page" }: Props) {
  const { getSetting, updateSetting } = useSettingsContext();
  const { setBreadcrumb } = useBreadcrumb();
  const { copyTable } = useClipboardTable();

  const [config, setConfig] = useState<ArticleSettingsModel>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState("");
  const [selctedForDelete, setSelectedForDelete] =
    useState<PageResponseDetailsModel | null>(null);

  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);
  const [activeView, setActiveView] = useState<FilterView | null>(null);

  const { t, i18n } = useTranslation("pages");
  const navigate = useNavigate();

  const itemsPerPage = 15;
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const searchQuery = searchParams.get("search") || "";
  const debouncedSearchInput = useDebounce(searchInput, 500);

  const { data, loading, fetchData, pagination } =
    useApi<PageResponseDetailsModel[]>();
  const hasPermission = useHasPermission();
  const permissionPrefix = pageType === "Page" ? "core:pages" : "core:articles";
  const canCreate = hasPermission(`${permissionPrefix}.create`);
  const canUpdate = hasPermission(`${permissionPrefix}.update`);
  const canDelete = hasPermission(`${permissionPrefix}.delete`);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const items = [{ label: t("breadcrumb.home"), path: "/" }];

    if (pageType === "Page") {
      (async () => {
        const { value } = await getSetting<{
          value: ArticleSettingsModel;
        }>("core", "core:page");

        if (value) setConfig(value);
      })();

      items.push({ label: t("breadcrumb.pages"), path: "/pages" });
    } else {
      (async () => {
        const { value } = await getSetting<{
          value: ArticleSettingsModel;
        }>("core", "core:article");

        if (value) setConfig(value);
      })();
      items.push({ label: t("breadcrumb.articles"), path: "/articles" });
    }

    setBreadcrumb(items);
  }, [getSetting, pageType, setBreadcrumb, t]);

  // Modifica buildApiUrl per includere i filtri
  const buildApiUrl = useCallback(
    (page: number, search: string, filters: FilterCondition[] = []) => {
      const params = new URLSearchParams();

      // Parametri base
      params.set("type", pageType);
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

      return `pages?${params.toString()}`;
    },
    [pageType, itemsPerPage]
  );

  useEffect(() => {
    const effectiveSearch =
      debouncedSearchInput.length >= 3 ? debouncedSearchInput : "";

    const params = new URLSearchParams();
    params.set("page", currentPage.toString());
    if (effectiveSearch) {
      params.set("search", effectiveSearch);
    }

    const currentParams = searchParams.toString();
    const newParams = params.toString();
    if (currentParams !== newParams) {
      setSearchParams(params, { replace: true });
    }

    fetchData(buildApiUrl(currentPage, effectiveSearch, activeFilters));
  }, [
    debouncedSearchInput,
    currentPage,
    pageType,
    fetchData,
    setSearchParams,
    searchParams,
    buildApiUrl,
    activeFilters,
  ]);

  const handleCopy = () => {
    if (!data) return;
    copyTable(data, [
      { key: "title", label: t("fields.title") },
      { key: "tags", label: t("fields.tags") },
      { key: "languages", label: t("fields.languages") },
      { key: "status", label: t("fields.status") },
      { key: "publishAt", label: t("fields.publishAt") },
    ]);
  };

  const renderTitle = (
    translations: Record<string, { title: string }>
  ): string => {
    const lang = i18n.language;
    if (translations[lang]?.title) {
      return translations[lang].title;
    }
    const first = Object.values(translations)[0];
    return first.title;
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (currentPage !== 1) {
      const params = new URLSearchParams(searchParams);
      params.set("page", "1");
      setSearchParams(params);
    }
  };

  const handlePageChange = (page: number) => {
    const effectiveSearch = searchInput.length >= 3 ? searchInput : "";
    fetchData(buildApiUrl(page, effectiveSearch, activeFilters));

    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    if (effectiveSearch) {
      params.set("search", effectiveSearch);
    }
    setSearchParams(params);
  };

  const handleDelete = async () => {
    if (!selctedForDelete) return;
    const { data } = await fetchData(`pages/${selctedForDelete.id}`, "DELETE");
    const toastId = toast.loading("Eliminazione in corso...");
    if (data) {
      toast.success(
        pageType === "Page" ? "Pagina eliminata" : "Articolo eliminato",
        {
          id: toastId,
          description: `Titolo: ${selctedForDelete.translations ? renderTitle(selctedForDelete.translations) : "N/A"}`,
        }
      );
      setSelectedForDelete(null);
      fetchData(buildApiUrl(currentPage, searchInput, activeFilters));
    }
  };

  const handleApplyFilters = (filters: FilterCondition[]) => {
    setActiveFilters(filters);
    setActiveView(null);

    if (currentPage !== 1) {
      const params = new URLSearchParams(searchParams);
      params.set("page", "1");
      setSearchParams(params);
    }

    toast.success("Filtri applicati", {
      description: `${filters.length} filtri attivi`,
    });
  };

  const handleSaveView = async (view: FilterView) => {
    if (!config) return;

    try {
      const updatedViews = [...(config.views || []), view];
      const updatedConfig = { ...config, views: updatedViews };

      await updateSetting(
        "core",
        `core:${pageType === "Page" ? "page" : "article"}`,
        updatedConfig
      );
      setConfig(updatedConfig);

      toast.success("Vista salvata", {
        description: `Vista "${view.name}" salvata con successo`,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Errore nel salvare la vista");
    }
  };

  const handleDeleteView = async (id: string) => {
    if (!config) return;

    try {
      const viewToDelete = config.views?.find((v) => v.id === id);
      const updatedViews = config.views?.filter((v) => v.id !== id) || [];
      const updatedConfig = { ...config, views: updatedViews };

      await updateSetting(
        "core",
        `core:${pageType === "Page" ? "page" : "article"}`,
        updatedConfig
      );
      setConfig(updatedConfig);

      if (activeView?.id === id) {
        setActiveView(null);
        setActiveFilters([]);
      }

      toast.success("Vista eliminata", {
        description: `Vista "${viewToDelete?.name || "Sconosciuta"}" eliminata con successo`,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Errore nell'eliminare la vista");
    }
  };

  const handleLoadView = (view: FilterView) => {
    setActiveView(view);
    setActiveFilters(view.conditions);

    if (currentPage !== 1) {
      const params = new URLSearchParams(searchParams);
      params.set("page", "1");
      setSearchParams(params);
    }

    toast.success("Vista caricata", {
      description: `Vista "${view.name}" applicata`,
    });
  };

  const renderTags = (tags: string[]) => {
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

  const hasActiveFilters = activeFilters.length > 0;
  const activeFilterCount = activeFilters.length;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full shadow-neutral-50 gap-0 py-0">
        <CardHeader className="bg-secondary text-primary py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <CardTitle>{t("title.managePages")}</CardTitle>
              {/* Indicatori filtri e vista attiva - A CAPO sotto il titolo */}
              {(hasActiveFilters || activeView) && (
                <div className="flex items-center gap-2 flex-wrap">
                  {hasActiveFilters && (
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 text-xs"
                    >
                      {activeFilterCount} filtri attivi
                    </Badge>
                  )}
                  {activeView && (
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-800 border-green-300 text-xs"
                    >
                      Vista: {activeView.name}
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
                className="cursor-pointer shadow-none bg-neutral-100"
                onClick={() => setShowSearch(!showSearch)}
              >
                <Search className="h-4 w-4 text-neutral-500" />
              </Button>

              {showSearch && (
                <div className="transform transition-all duration-500 ease-in-out origin-right">
                  <Input
                    type="text"
                    placeholder={t("search.placeholder")}
                    className="w-[200px] animate-in fade-in slide-in-from-right-1 duration-300 bg-white shadow-muted"
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                  {searchInput.length > 0 && searchInput.length < 3 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Inserisci almeno 3 caratteri per cercare
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
                      onClick={() =>
                        navigate(
                          `/${pageType === "Page" ? "pages" : "articles"}/create`
                        )
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t(
                        pageType === "Page"
                          ? "buttons.addPage"
                          : "buttons.addPost"
                      )}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleCopy}>
                    <Clipboard className="mr-2 h-4 w-4" />
                    {t("buttons.copy")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => console.log(t("buttons.download"))}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {t("buttons.download")}
                  </DropdownMenuItem>
                  {/* Azione per pulire i filtri */}
                  {hasActiveFilters && (
                    <DropdownMenuItem
                      onClick={() => {
                        setActiveFilters([]);
                        setActiveView(null);
                        toast.success("Filtri rimossi");
                      }}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Rimuovi filtri
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0 text-sm">
          <DataTable<PageResponseDetailsModel>
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
                  new Intl.DateTimeFormat("it-IT", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(v as string)),
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
                              navigate(
                                `/${
                                  pageType === "Page" ? "pages" : "articles"
                                }/${row.id}?view=editor`
                              );
                            }}
                          >
                            <LayoutTemplate className="mr-2 h-4 w-4" />
                            {t("buttons.editVisual")}
                          </DropdownMenuItem>
                        )}
                        {canUpdate && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                `/${
                                  pageType === "Page" ? "pages" : "articles"
                                }/${row.id}`
                              );
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
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(
                              `/${
                                pageType === "Page" ? "pages" : "articles"
                              }/${row.id}?view=json`
                            );
                          }}
                        >
                          <Code className="mr-2 h-4 w-4" />
                          {t("buttons.viewJson")}
                        </DropdownMenuItem>
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
            onRowClick={(row) =>
              navigate(
                `/${pageType === "Page" ? "pages" : "articles"}/${row.id}`
              )
            }
          />
        </CardContent>
      </Card>
      <DeleteDialog
        isOpen={!!selctedForDelete}
        onClose={() => setSelectedForDelete(null)}
        onDelete={handleDelete}
        name={
          selctedForDelete ? renderTitle(selctedForDelete?.translations) : ""
        }
      />
      {config && (
        <FilterModal
          onApplyFilters={handleApplyFilters}
          isOpen={showFilter}
          onClose={() => setShowFilter(false)}
          config={{
            fields: config.filterFields,
            views: config.views,
            allowSaveViews: true,
          }}
          onDeleteView={handleDeleteView}
          onSaveView={handleSaveView}
          onLoadView={handleLoadView}
          initialConditions={activeFilters}
        />
      )}
    </div>
  );
}
