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
} from "@kitejs-cms/dashboard-core";
import {
  Clipboard,
  Download,
  Edit,
  MoreVertical,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

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

function LanguagesBadge(translations: Record<string, unknown>) {
  const langs = Object.keys(translations);
  return (
    <div className="flex items-center gap-1">
      {langs.map((lang) => (
        <Badge
          key={lang}
          variant="outline"
          className="border-gray-200 bg-gray-50 font-normal"
        >
          {lang.toUpperCase()}
        </Badge>
      ))}
    </div>
  );
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

  const [showSearch, setShowSearch] = useState(false);
  const [collectionToDelete, setCollectionToDelete] =
    useState<CollectionListItem | null>(null);

  const itemsPerPage = ITEMS_PER_PAGE;
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const searchQuery = searchParams.get("search") || "";

  const canCreate = hasPermission("plugin-commerce:collections.create");
  const canUpdate = hasPermission("plugin-commerce:collections.update");
  const canDelete = hasPermission("plugin-commerce:collections.delete");

  useEffect(() => {
    setBreadcrumb([
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.collections"), path: "/commerce/collections" },
    ]);
  }, [setBreadcrumb, t]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", currentPage.toString());
    if (searchQuery) params.set("search", searchQuery);
    setSearchParams(params, { replace: true });

    const apiParams = new URLSearchParams();
    apiParams.set("page[number]", currentPage.toString());
    apiParams.set("page[size]", itemsPerPage.toString());
    if (searchQuery.trim()) {
      apiParams.set("search", searchQuery.trim());
    }

    void fetchData(`commerce/collections?${apiParams.toString()}`);
  }, [fetchData, currentPage, searchQuery, itemsPerPage, setSearchParams]);

  const collections = data ?? [];

  const handleCopy = () => {
    if (!collections.length) return;
    const dataset = collections.map((row) => ({
      ...row,
      titleForClipboard: getCollectionTitle(row),
      languagesForClipboard: Object.keys(row.translations).join(", "),
      tagsForClipboard: row.tags?.length ? row.tags.join(", ") : "-",
      statusForClipboard: row.status ?? "-",
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

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full gap-0 py-0 shadow-neutral-50">
        <CardHeader className="rounded-t-xl bg-secondary py-4 text-primary">
          <div className="flex items-center justify-between">
            <CardTitle>{t("collections.title.manage")}</CardTitle>
            <div className="flex items-center gap-2">
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
                    value={searchQuery}
                    onChange={(event) => {
                      const value = event.target.value;
                      const params = new URLSearchParams(searchParams);
                      if (value) params.set("search", value);
                      else params.delete("search");
                      params.set("page", "1");
                      setSearchParams(params);
                    }}
                  />
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
                  if (searchQuery.trim()) {
                    params.set("search", searchQuery.trim());
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
    </div>
  );
}
