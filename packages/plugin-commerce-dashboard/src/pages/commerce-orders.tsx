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
} from "@kitejs-cms/dashboard-core";

interface OrderListItem {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  currencyCode: string;
  total: number;
  updatedAt?: string;
}

export function CommerceOrdersPage() {
  const { t, i18n } = useTranslation("commerce");
  const navigate = useNavigate();
  const { setBreadcrumb } = useBreadcrumb();
  const { data, loading, fetchData } = useApi<OrderListItem[]>();

  useEffect(() => {
    setBreadcrumb([
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.orders"), path: "/commerce/orders" },
    ]);
  }, [setBreadcrumb, t]);

  useEffect(() => {
    void fetchData("commerce/orders");
  }, [fetchData]);

  const orders = data ?? [];

  const formatMoney = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat(i18n.language, {
        style: "currency",
        currency,
      }).format(amount / 100);
    } catch {
      return `${amount / 100} ${currency}`;
    }
  };

  const formatDate = (value?: string) => {
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
            <CardTitle>{t("orders.pageTitle")}</CardTitle>
            <CardDescription>{t("orders.pageDescription")}</CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => fetchData("commerce/orders")}
            disabled={loading}
          >
            {t("orders.actions.refresh")}
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <h3 className="text-lg font-semibold">
                {t("orders.emptyState.title")}
              </h3>
              <p className="max-w-lg text-sm text-muted-foreground">
                {t("orders.emptyState.description")}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("orders.table.columns.number")}</TableHead>
                  <TableHead>{t("orders.table.columns.status")}</TableHead>
                  <TableHead>{t("orders.table.columns.payment")}</TableHead>
                  <TableHead>{t("orders.table.columns.total")}</TableHead>
                  <TableHead>{t("orders.table.columns.updatedAt")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/commerce/orders/${order.id}`)}
                  >
                    <TableCell className="font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {t(`orders.status.${order.status}`, {
                          defaultValue: order.status,
                        })}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {t(`orders.paymentStatus.${order.paymentStatus}`, {
                          defaultValue: order.paymentStatus,
                        })}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatMoney(order.total, order.currencyCode)}
                    </TableCell>
                    <TableCell>{formatDate(order.updatedAt)}</TableCell>
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
