import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  useApi,
  useBreadcrumb,
  useSettingsContext,
} from "@kitejs-cms/dashboard-core";
import { ProductResponseDetailsModel } from "@kitejs-cms/plugin-commerce-api";

export function useProductDetails() {
  const navigate = useNavigate();
  const { t } = useTranslation("commerce");
  const { setBreadcrumb } = useBreadcrumb();
  const { cmsSettings } = useSettingsContext();

  const defaultLang = useMemo(
    () => cmsSettings?.defaultLanguage || "en",
    [cmsSettings]
  );

  const { loading, fetchData } = useApi<ProductResponseDetailsModel>();
  const [activeLang, setActiveLang] = useState(defaultLang);
  const { id } = useParams<{ id: string }>();

  const [localData, setLocalData] =
    useState<ProductResponseDetailsModel | null>(null);

  useEffect(() => {
    const items = [
      { label: t("breadcrumb.home"), path: "/" },
      { label: t("breadcrumb.collections"), path: "/commerce/collections" },
    ];

    if (id && localData && localData?.translations[activeLang]?.slug)
      items.push({
        label: localData.translations[activeLang].slug,
        path: `/commerce/collections/${localData.id}`,
      });

    setBreadcrumb(items);
  }, [activeLang, id, localData, setBreadcrumb, t]);

  return {};
}
