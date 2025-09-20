import type { ReactNode } from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useApi,
  useBreadcrumb,
} from "@kitejs-cms/dashboard-core";

interface OrderAddress {
  firstName?: string;
  lastName?: string;
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  postalCode?: string;
  province?: string;
  countryCode?: string;
  phone?: string;
}

interface OrderItem {
  id?: string;
  title: string;
  variantTitle?: string;
  quantity: number;
  unitPrice: number;
  currencyCode: string;
  total: number;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  currencyCode: string;
  subtotal: number;
  shippingTotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  tags: string[];
  notes?: string;
  email?: string;
  billingAddress?: OrderAddress;
  shippingAddress?: OrderAddress;
  items: OrderItem[];
  updatedAt?: string;
  createdAt?: string;
}

export function CommerceOrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation("commerce");
  const navigate = useNavigate();
  const { setBreadcrumb } = useBreadcrumb();
  const { data: order, loading, fetchData } = useApi<OrderDetail>();

  useEffect(() => {
    setBreadcrumb([
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.orders"), path: "/commerce/orders" },
      {
        label: order?.orderNumber ?? t("orders.details.breadcrumb"),
        path: `/commerce/orders/${id ?? ""}`,
      },
    ]);
  }, [setBreadcrumb, t, order?.orderNumber, id]);

  useEffect(() => {
    if (id) {
      void fetchData(`commerce/orders/${id}`);
    }
  }, [fetchData, id]);

  if (loading || !order) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const formatMoney = (amount: number) => {
    try {
      return new Intl.NumberFormat(i18n.language, {
        style: "currency",
        currency: order.currencyCode,
      }).format(amount / 100);
    } catch {
      return `${amount / 100} ${order.currencyCode}`;
    }
  };

  const formatDateTime = (value?: string) => {
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
          <CardTitle>{t("orders.details.title", { number: order.orderNumber })}</CardTitle>
          <CardDescription>{t("orders.details.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2">
            <DetailItem
              label={t("orders.details.status")}
              value={
                <Badge variant="secondary">
                  {t(`orders.status.${order.status}`, {
                    defaultValue: order.status,
                  })}
                </Badge>
              }
            />
            <DetailItem
              label={t("orders.details.paymentStatus")}
              value={
                <Badge variant="outline">
                  {t(`orders.paymentStatus.${order.paymentStatus}`, {
                    defaultValue: order.paymentStatus,
                  })}
                </Badge>
              }
            />
            <DetailItem
              label={t("orders.details.fulfillmentStatus")}
              value={
                <Badge variant="outline">
                  {t(`orders.fulfillmentStatus.${order.fulfillmentStatus}`, {
                    defaultValue: order.fulfillmentStatus,
                  })}
                </Badge>
              }
            />
            <DetailItem
              label={t("orders.details.lastUpdate")}
              value={formatDateTime(order.updatedAt)}
            />
          </section>

          <Separator />

          <section className="grid gap-4 md:grid-cols-2">
            <DetailItem
              label={t("orders.details.subtotal")}
              value={formatMoney(order.subtotal)}
            />
            <DetailItem
              label={t("orders.details.shipping")}
              value={formatMoney(order.shippingTotal)}
            />
            <DetailItem
              label={t("orders.details.tax")}
              value={formatMoney(order.taxTotal)}
            />
            <DetailItem
              label={t("orders.details.discount")}
              value={formatMoney(order.discountTotal)}
            />
            <DetailItem
              label={t("orders.details.total")}
              value={formatMoney(order.total)}
            />
          </section>

          <Separator />

          <section className="grid gap-6 md:grid-cols-2">
            <DetailItem
              label={t("orders.details.billingAddress")}
              value={formatAddress(order.billingAddress)}
            />
            <DetailItem
              label={t("orders.details.shippingAddress")}
              value={formatAddress(order.shippingAddress)}
            />
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">{t("orders.details.items")}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("orders.items.columns.title")}</TableHead>
                  <TableHead>{t("orders.items.columns.variant")}</TableHead>
                  <TableHead>{t("orders.items.columns.quantity")}</TableHead>
                  <TableHead>{t("orders.items.columns.total")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id ?? `${item.title}-${item.variantTitle}`}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{item.variantTitle ?? "-"}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatMoney(item.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          {order.notes ? (
            <section className="space-y-2">
              <h3 className="text-lg font-semibold">{t("orders.details.notes")}</h3>
              <p className="rounded-md border bg-muted/50 p-4 text-sm text-muted-foreground">
                {order.notes}
              </p>
            </section>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function formatAddress(address?: OrderAddress): ReactNode {
  if (!address) {
    return <span className="text-muted-foreground">-</span>;
  }

  const lines = [
    [address.firstName, address.lastName].filter(Boolean).join(" "),
    address.company,
    [address.address1, address.address2].filter(Boolean).join(", "),
    [address.city, address.province, address.postalCode]
      .filter(Boolean)
      .join(", "),
    address.countryCode,
    address.phone,
  ]
    .map((line) => line?.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <div className="space-y-1 text-sm text-foreground">
      {lines.map((line) => (
        <div key={line}>{line}</div>
      ))}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}
