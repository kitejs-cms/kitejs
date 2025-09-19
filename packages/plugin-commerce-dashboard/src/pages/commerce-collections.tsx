import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
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
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Skeleton,
  useApi,
  useBreadcrumb,
  useDebounce,
  useHasPermission,
} from "@kitejs-cms/dashboard-core";
import { MoreVertical, PenSquare, Plus, Search, Trash2 } from "lucide-react";

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

export function CommerceCollectionsPage() {
  const { t, i18n } = useTranslation("commerce");
  const navigate = useNavigate();
  const { setBreadcrumb } = useBreadcrumb();
  const { data, loading, error, fetchData, pagination } = useApi<CollectionListItem[]>();
  const deleteApi = useApi<unknown>();
  const hasPermission = useHasPermission();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [collectionToDelete, setCollectionToDelete] = useState<CollectionListItem | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const canCreate = hasPermission("plugin-commerce:collections.create");
  const canDelete = hasPermission("plugin-commerce:collections.delete");

  useEffect(() => {
    setBreadcrumb([
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.collections"), path: "/commerce/collections" },
    ]);
  }, [setBreadcrumb, t]);

  const buildApiUrl = useCallback((pageNumber: number, searchTerm: string) => {
    const params = new URLSearchParams();
    params.set("page[number]", pageNumber.toString());
    params.set("page[size]", ITEMS_PER_PAGE.toString());
    if (searchTerm.trim().length >= 2) {
      params.set("search", searchTerm.trim());
    }
    return `commerce/collections?${params.toString()}`;
  }, []);

  useEffect(() => {
    const effectiveSearch = debouncedSearch.trim();
    void fetchData(buildApiUrl(page, effectiveSearch));
  }, [fetchData, page, debouncedSearch, buildApiUrl]);

  const collections = data ?? [];

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
  };

  const handleRefresh = () => {
    const effectiveSearch = debouncedSearch.trim();
    void fetchData(buildApiUrl(page, effectiveSearch));
  };

  const handleDelete = async () => {
    if (!collectionToDelete) return;
    const { error: deleteError } = await deleteApi.fetchData(
      `commerce/collections/${collectionToDelete.id}`,
      "DELETE"
    );
    if (!deleteError) {
      setCollectionToDelete(null);
      const effectiveSearch = debouncedSearch.trim();
      void fetchData(buildApiUrl(page, effectiveSearch));
    }
  };

  const formatDate = useCallback(
    (value?: string) => {
      if (!value) return "-";
      try {
        return new Intl.DateTimeFormat(i18n.language, {
          year: "numeric",
          month: "short",
          day: "numeric",
        }).format(new Date(value));
      } catch {
        return value;
      }
    },
    [i18n.language]
  );

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

  const columns = useMemo(
    () => [
      {
        key: "translations" as const,
        label: t("collections.table.columns.name"),
        render: (_value: unknown, row: CollectionListItem) => (
          <div className="flex flex-col">
            <span className="font-medium text-sm text-foreground">
              {getCollectionTitle(row)}
            </span>
            {row.translations?.[i18n.language]?.slug && (
              <span className="text-xs text-muted-foreground">
                {row.translations[i18n.language]?.slug}
              </span>
            )}
          </div>
        ),
      },
      {
        key: "status" as const,
        label: t("collections.table.columns.status"),
        render: (value) => {
          const status = value as CollectionStatus | undefined;
          return status ? (
            <Badge variant="secondary">
              {t(`collections.status.${status}`, { defaultValue: status })}
            </Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          );
        },
      },
      {
        key: "tags" as const,
        label: t("collections.table.columns.tags"),
        render: (value) => {
          const tags = value as string[] | undefined;
          return tags && tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="font-normal">
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 ? (
                <span className="text-xs text-muted-foreground">
                  +{tags.length - 3}
                </span>
              ) : null}
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          );
        },
      },
      {
        key: "updatedAt" as const,
        label: t("collections.table.columns.updatedAt"),
        render: (value) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(value as string | undefined)}
          </span>
        ),
      },
      {
        key: "id" as const,
        label: "",
        render: (_value, row: CollectionListItem) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(event) => event.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(event) => {
                  event.stopPropagation();
                  navigate(`/commerce/collections/${row.id}`);
                }}
              >
                <PenSquare className="mr-2 h-4 w-4" />
                {t("collections.actions.open")}
              </DropdownMenuItem>
              {canDelete ? (
                <DropdownMenuItem
                  onClick={(event) => {
                    event.stopPropagation();
                    setCollectionToDelete(row);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("collections.actions.delete")}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [
      t,
      i18n.language,
      getCollectionTitle,
      formatDate,
      navigate,
      canDelete,
    ]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle>{t("collections.pageTitle")}</CardTitle>
            <CardDescription>{t("collections.pageDescription")}</CardDescription>
          </div>
          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
            <div className="relative md:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder={t("collections.actions.search")}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRefresh} disabled={loading}>
                {t("collections.actions.refresh")}
              </Button>
              {canCreate ? (
                <Button onClick={() => navigate("/commerce/collections/new")}> 
                  <Plus className="mr-2 h-4 w-4" />
                  {t("collections.actions.create")}
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {t("collections.table.error")}
            </div>
          ) : null}

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : collections.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <h3 className="text-lg font-semibold">
                {t("collections.emptyState.title")}
              </h3>
              <p className="max-w-md text-sm text-muted-foreground">
                {t("collections.emptyState.description")}
              </p>
              {canCreate ? (
                <Button onClick={() => navigate("/commerce/collections/new")}> 
                  {t("collections.actions.create")}
                </Button>
              ) : null}
            </div>
          ) : (
            <DataTable<CollectionListItem>
              data={collections}
              columns={columns}
              isLoading={loading}
              onRowClick={(row) => navigate(`/commerce/collections/${row.id}`)}
              pagination=
                {pagination
                  ? {
                      currentPage: pagination.currentPage,
                      totalPages: Math.max(pagination.totalPages, 1),
                      onPageChange: handlePageChange,
                    }
                  : undefined}
            />
          )}
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
              onClick={handleDelete}
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
