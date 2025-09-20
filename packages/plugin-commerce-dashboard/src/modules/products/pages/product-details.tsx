import type { ReactNode } from "react";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
  Skeleton,
  useApi,
  useBreadcrumb,
} from "@kitejs-cms/dashboard-core";

interface ProductTranslation {
  title?: string;
  subtitle?: string;
  summary?: string;
  description?: string;
  slug?: string;
}

interface ProductDetail {
  id: string;
  status?: string;
  tags?: string[];
  defaultCurrency?: string;
  publishAt?: string | null;
  expireAt?: string | null;
  gallery?: string[];
  slugs: Record<string, string>;
  translations: Record<string, ProductTranslation>;
  createdAt?: string;
  updatedAt?: string;
}

export function CommerceProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { t, i18n } = useTranslation("commerce");
  const navigate = useNavigate();
  const { setBreadcrumb } = useBreadcrumb();
  const isCreating = !id && location.pathname.endsWith("/new");
  const {
    data: product,
    loading,
    fetchData,
  } = useApi<ProductDetail>();

  const resolveProductTitle = useCallback(
    (current?: ProductDetail) => {
      if (!current) {
        return t("products.details.breadcrumb");
      }
      const translation =
        current.translations?.[i18n.language] ?? current.translations?.en;
      if (translation?.title) {
        return translation.title;
      }
      return t("products.details.breadcrumb");
    },
    [i18n.language, t]
  );

  useEffect(() => {
    setBreadcrumb([
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.products"), path: "/commerce/products" },
      isCreating
        ? { label: t("products.create.breadcrumb"), path: location.pathname }
        : {
            label: resolveProductTitle(product ?? undefined),
            path: location.pathname,
          },
    ]);
  }, [
    setBreadcrumb,
    t,
    location.pathname,
    isCreating,
    product,
    resolveProductTitle,
  ]);

  useEffect(() => {
    if (!isCreating && id) {
      void fetchData(`commerce/products/${id}`);
    }
  }, [fetchData, id, isCreating]);

  if (isCreating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("products.create.title")}</CardTitle>
          <CardDescription>{t("products.create.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("products.create.helper")}
          </p>
          <Button onClick={() => navigate(-1)} variant="outline">
            {t("common.back")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading || !product) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const translation =
    product.translations?.[i18n.language] ?? product.translations?.en ?? {};

  const formatDateTime = (value?: string | null) => {
    if (!value) return "-";
    try {
      return new Intl.DateTimeFormat(i18n.language, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value));
    } catch {
      return value;
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="px-0">
        {t("common.back")}
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{translation.title ?? t("products.details.title")}</CardTitle>
          <CardDescription>
            {translation.subtitle ?? t("products.details.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-lg font-semibold">
              {t("products.details.generalInformation")}
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <DetailItem
                label={t("products.details.status")}
                value={
                  product.status ? (
                    <Badge variant="secondary">
                      {t(`products.status.${product.status}`, {
                        defaultValue: product.status,
                      })}
                    </Badge>
                  ) : (
                    "-"
                  )
                }
              />
              <DetailItem
                label={t("products.details.currency")}
                value={product.defaultCurrency ?? "-"}
              />
              <DetailItem
                label={t("products.details.publishAt")}
                value={formatDateTime(product.publishAt)}
              />
              <DetailItem
                label={t("products.details.expireAt")}
                value={formatDateTime(product.expireAt)}
              />
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">
              {t("products.details.contentSection")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {translation.summary ?? t("products.details.noSummary")}
            </p>
            <DetailItem
              label={t("products.details.slug")}
              value={translation.slug ?? product.slugs?.[i18n.language] ?? "-"}
            />
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">
              {t("products.details.additionalInformation")}
            </h3>
            <DetailItem
              label={t("products.details.tags")}
              value={
                product.tags?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )
              }
            />
            <DetailItem
              label={t("products.details.media")}
              value={t("products.details.galleryCount", {
                count: product.gallery?.length ?? 0,
              })}
            />
            <DetailItem
              label={t("products.details.updatedAt")}
              value={formatDateTime(product.updatedAt)}
            />
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}
