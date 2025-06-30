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
import type { PageResponseDetailsModel } from "@kitejs-cms/core/index";
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
} from "lucide-react";
import { StatusBadge } from "../components/status-badge";
import { LanguagesBadge } from "../components/languages-badge";
import { useDebounce } from "../../../hooks/use-debounce";
import { DeleteDialog } from "../components/delete-dialog";

export type Props = {
  pageType?: "Post" | "Page";
};

export function PagesManagePage({ pageType = "Page" }: Props) {
  const { setBreadcrumb } = useBreadcrumb();
  const { copyTable } = useClipboardTable();
  const [showSearch, setShowSearch] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState("");
  const [selctedForDelete, setSelectedForDelete] =
    useState<PageResponseDetailsModel | null>(null);

  const { t, i18n } = useTranslation("pages");
  const navigate = useNavigate();

  const itemsPerPage = 15;
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const searchQuery = searchParams.get("search") || "";
  const debouncedSearchInput = useDebounce(searchInput, 500);

  const { data, loading, fetchData, pagination } =
    useApi<PageResponseDetailsModel[]>();

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const items = [{ label: t("breadcrumb.home"), path: "/" }];

    if (pageType === "Page") {
      items.push({ label: t("breadcrumb.pages"), path: "/pages" });
    } else {
      items.push({ label: t("breadcrumb.articles"), path: "/articles" });
    }

    setBreadcrumb(items);
  }, [pageType, setBreadcrumb, t]);

  const buildApiUrl = useCallback(
    (page: number, search: string) => {
      const searchParam =
        search && search.length >= 3
          ? `&search=${encodeURIComponent(search)}`
          : "";
      return `pages?type=${pageType}&pgae[number]=${page}&pgae[size]=${itemsPerPage}${searchParam}`;
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

    fetchData(buildApiUrl(currentPage, effectiveSearch));
  }, [
    debouncedSearchInput,
    currentPage,
    pageType,
    fetchData,
    setSearchParams,
    searchParams,
    buildApiUrl,
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
    fetchData(buildApiUrl(page, effectiveSearch));

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
      fetchData(buildApiUrl(currentPage, searchInput));
    }
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

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full shadow-neutral-50 gap-0 py-0">
        <CardHeader className="bg-secondary text-primary py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <CardTitle>{t("title.managePages")}</CardTitle>
            <div className="flex items-center gap-2">
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
                render: (_, row) => (
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
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            `/${pageType === "Page" ? "pages" : "articles"}/${row.id}?view=editor`
                          );
                        }}
                      >
                        <LayoutTemplate className="mr-2 h-4 w-4" />
                        {t("buttons.editVisual")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            `/${pageType === "Page" ? "pages" : "articles"}/${row.id}`
                          );
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        {t("buttons.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedForDelete(row);
                        }}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        {t("buttons.delete")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            `/${pageType === "Page" ? "pages" : "articles"}/${row.id}?view=json`
                          );
                        }}
                      >
                        <Code className="mr-2 h-4 w-4" />
                        {t("buttons.viewJson")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ),
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
    </div>
  );
}
