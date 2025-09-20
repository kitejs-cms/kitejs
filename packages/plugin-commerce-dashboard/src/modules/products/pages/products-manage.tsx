import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useApi,
  useBreadcrumb,
  useHasPermission,
} from "@kitejs-cms/dashboard-core";

interface ProductListItem {
  id: string;
  status?: string;
  tags?: string[];
  defaultCurrency?: string;
  publishAt?: string | null;
  translations: Record<string, Record<string, unknown>>;
  updatedAt?: string;
}

export function CommerceProductsPage() {
  const { t, i18n } = useTranslation("commerce");
  const navigate = useNavigate();
  const { setBreadcrumb } = useBreadcrumb();
  const { data, loading, fetchData } = useApi<ProductListItem[]>();
  const hasPermission = useHasPermission();
  const canCreate = hasPermission("plugin-commerce:products.create");

  useEffect(() => {
    setBreadcrumb([
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.products"), path: "/commerce/products" },
    ]);
  }, [setBreadcrumb, t]);

  useEffect(() => {
    void fetchData("commerce/products");
  }, [fetchData]);

  const products = data ?? [];

  const getProductTitle = (product: ProductListItem) => {
    const language = i18n.language || "en";
    const translation = product.translations?.[language] ?? product.translations?.en;
    if (translation && typeof translation.title === "string") {
      return translation.title as string;
    }
    return t("products.table.untitled");
  };

  const formatDate = (value?: string | null) => {
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
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle>{t("products.pageTitle")}</CardTitle>
            <CardDescription>{t("products.pageDescription")}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fetchData("commerce/products")}
              disabled={loading}
            >
              {t("products.actions.refresh")}
            </Button>
            {canCreate ? (
              <Button onClick={() => navigate("/commerce/products/new")}>
                {t("products.actions.create")}
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <h3 className="text-lg font-semibold">
                {t("products.emptyState.title")}
              </h3>
              <p className="max-w-lg text-sm text-muted-foreground">
                {t("products.emptyState.description")}
              </p>
              {canCreate ? (
                <Button onClick={() => navigate("/commerce/products/new")}>
                  {t("products.actions.create")}
                </Button>
              ) : null}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("products.table.columns.name")}</TableHead>
                  <TableHead>{t("products.table.columns.status")}</TableHead>
                  <TableHead>{t("products.table.columns.currency")}</TableHead>
                  <TableHead>{t("products.table.columns.updatedAt")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow
                    key={product.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/commerce/products/${product.id}`)}
                  >
                    <TableCell className="font-medium">
                      {getProductTitle(product)}
                    </TableCell>
                    <TableCell>
                      {product.status ? (
                        <Badge variant="secondary">
                          {t(`products.status.${product.status}`, {
                            defaultValue: product.status,
                          })}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{product.defaultCurrency ?? "-"}</TableCell>
                    <TableCell>{formatDate(product.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
