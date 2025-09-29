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
  FilterModal,
  Input,
  LanguagesBadge,
  Separator,
} from "@kitejs-cms/dashboard-core";
import {
  Clipboard,
  Download,
  Edit,
  ListFilter,
  MoreVertical,
  Plus,
  Search,
  Trash,
  Trash2,
} from "lucide-react";
import {
  type ProductListItem,
  type ProductStatus,
  useProductsManage,
} from "../hooks/use-products-manage";

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

const renderStatus = (
  status: ProductStatus | undefined,
  getStatusLabel: (status?: ProductStatus) => string,
  statusBadgeStyles: Record<ProductStatus, string>
) => {
  if (!status) {
    return <span className="text-muted-foreground">-</span>;
  }

  const badgeClasses = statusBadgeStyles[status] || "border-gray-200 bg-gray-50";

  return (
    <Badge variant="outline" className={`${badgeClasses} font-normal`}>
      {getStatusLabel(status)}
    </Badge>
  );
};

export function CommerceProductsPage() {
  const {
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
    deleteLoading,
    productToDelete,
    getProductTitle,
    getStatusLabel,
    statusBadgeStyles,
    formatDate,
  } = useProductsManage();

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full gap-0 py-0 shadow-neutral-50">
        <CardHeader className="rounded-t-xl bg-secondary py-4 text-primary">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <CardTitle>{t("products.pageTitle")}</CardTitle>
              {(hasActiveFilters || activeView) && (
                <div className="flex flex-wrap items-center gap-2">
                  {hasActiveFilters && (
                    <Badge
                      variant="secondary"
                      className="w-fit bg-blue-100 text-blue-800"
                    >
                      {t("products.filters.active", {
                        count: activeFilterCount,
                      })}
                    </Badge>
                  )}
                  {activeView && (
                    <Badge
                      variant="outline"
                      className="w-fit border-green-300 bg-green-100 text-green-800"
                    >
                      {t("products.filters.activeView", {
                        name: activeView.name,
                      })}
                    </Badge>
                  )}
                </div>
              )}
              <p className="text-sm text-primary/70">
                {t("products.pageDescription")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={hasActiveFilters ? "default" : "outline"}
                size="icon"
                className="cursor-pointer shadow-none"
                onClick={openFilter}
              >
                <ListFilter className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="cursor-pointer bg-neutral-100 shadow-none"
                onClick={toggleSearch}
              >
                <Search className="h-4 w-4 text-neutral-500" />
              </Button>
              {showSearch && (
                <div className="origin-right transform transition-all duration-500 ease-in-out">
                  <Input
                    type="text"
                    placeholder={t("products.search.placeholder")}
                    className="w-[200px] animate-in fade-in slide-in-from-right-1 duration-300 bg-white shadow-muted"
                    value={searchInput}
                    onChange={(event) => handleSearchChange(event.target.value)}
                  />
                  {searchInput.length > 0 && searchInput.trim().length < 3 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("products.search.minLength")}
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
                    <DropdownMenuItem onClick={handleCreate}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t("products.buttons.add")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleCopy}>
                    <Clipboard className="mr-2 h-4 w-4" />
                    {t("products.buttons.copy")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => console.log(t("products.buttons.download"))}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {t("products.buttons.download")}
                  </DropdownMenuItem>
                  {hasActiveFilters && (
                    <DropdownMenuItem onClick={handleClearFilters}>
                      <Trash className="mr-2 h-4 w-4" />
                      {t("products.filters.clear")}
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
              {t("products.table.error")}
            </div>
          )}
          <DataTable<ProductListItem>
            data={products}
            isLoading={loading}
            columns={[
              {
                key: "translations" as never,
                label: t("products.fields.title"),
                render: (_, row) => getProductTitle(row),
              },
              {
                key: "status" as never,
                label: t("products.fields.status"),
                render: (_, row) =>
                  renderStatus(row.status, getStatusLabel, statusBadgeStyles),
              },
              {
                key: "translations" as never,
                label: t("products.fields.languages"),
                render: (_, row) => LanguagesBadge(row.translations),
              },
              {
                key: "tags" as never,
                label: t("products.fields.tags"),
                render: (_, row) => renderTags(row.tags),
              },
              {
                key: "defaultCurrency" as never,
                label: t("products.fields.currency"),
                render: (value) => {
                  const currency = value as string | null | undefined;
                  return currency ?? "-";
                },
              },
              {
                key: "publishAt" as never,
                label: t("products.fields.publishAt"),
                render: (value) => formatDate(value as string | null | undefined),
              },
              {
                key: "updatedAt" as never,
                label: t("products.fields.updatedAt"),
                render: (value) => formatDate(value as string | null | undefined),
              },
              {
                key: "id" as never,
                label: t("products.fields.actions"),
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
                              handleRowClick(row.id);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            {t("products.buttons.edit")}
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <DropdownMenuItem
                            onClick={(event) => {
                              event.stopPropagation();
                              requestDelete(row);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("products.buttons.delete")}
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
            onRowClick={(row) => handleRowClick(row.id)}
            emptyMessage={t("products.table.empty")}
          />
        </CardContent>
      </Card>

      <AlertDialog
        open={productToDelete !== null}
        onOpenChange={(open) => !open && cancelDelete()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("products.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("products.delete.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("products.delete.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteLoading}
            >
              {t("products.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FilterModal
        isOpen={showFilter}
        onClose={closeFilter}
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
