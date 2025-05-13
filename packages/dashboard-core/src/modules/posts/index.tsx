import { Newspaper } from "lucide-react";
import { DashboardModule } from "../../models/module.model";
import { CategoriesManagePage } from "./pages/categories-manage";
import { CategoryDetailsPage } from "./pages/category-details";

/* i18n */
import it from "./locales/it.json";
import en from "./locales/en.json";

export const PostModule: DashboardModule = {
  name: "posts",
  key: "posts",
  translations: { it, en },
  routes: [
    {
      path: "categories",
      element: <CategoriesManagePage />,
      label: "posts:menu.categories",
    },
    {
      path: "categories/:id",
      element: <CategoryDetailsPage />,
      label: "posts:menu.categories",
    },
  ],
  menuItem: {
    title: "posts:menu.posts",
    icon: Newspaper,
    items: [
      {
        url: "/categories",
        title: "posts:menu.categories",
        icon: Newspaper,
      },
      {
        url: "/articles",
        title: "posts:menu.posts",
        icon: Newspaper,
      },
    ],
  },
};
