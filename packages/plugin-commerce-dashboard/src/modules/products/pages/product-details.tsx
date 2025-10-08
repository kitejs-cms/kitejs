import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useProductDetails } from "../hooks/use-product-details";

export function CommerceProductDetailsPage() {
  const { t } = useTranslation("commerce");
  const [jsonView, setJsonView] = useState(false);
}
