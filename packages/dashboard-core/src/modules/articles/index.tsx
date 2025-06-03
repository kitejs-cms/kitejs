import { Newspaper } from "lucide-react";
import { DashboardModule } from "../../models/module.model";
import { CategoriesManagePage } from "./pages/categories-manage";
import { CategoryDetailsPage } from "./pages/category-details";
import { ArticleDetailsPage } from "./pages/article-details";
import { ArticlesManagePage } from "./pages/artilces-manage";
import { ArticleFieldsSettings } from "./components/article-filds-settings";

/* i18n */
import it from "./locales/it.json";
import en from "./locales/en.json";

export const PostModule: DashboardModule = {
  name: "articles",
  key: "articles",
  translations: { it, en },
  settings: {
    key: "articles",
    title: "articles:menu.articles",
    icon: <Newspaper />,
    description: "articles:settings.description",
    children: [
      {
        key: "article-settings",
        title: "articles:settings.article-filds.title",
        icon: <Newspaper />,
        component: <ArticleFieldsSettings />,
      },
    ],
  },
  routes: [
    {
      path: "categories",
      element: <CategoriesManagePage />,
      label: "articles:menu.categories",
    },
    {
      path: "categories/:id",
      element: <CategoryDetailsPage />,
      label: "articles:menu.categories",
    },
    {
      path: "articles",
      element: <ArticlesManagePage />,
      label: "articles:menu.articles",
    },
    {
      path: "articles/:id",
      element: <ArticleDetailsPage />,
      label: "articles:menu.articles",
    },
  ],
  menuItem: {
    title: "articles:menu.articles",
    icon: Newspaper,
    items: [
      {
        url: "/categories",
        title: "articles:menu.categories",
        icon: Newspaper,
      },
      {
        url: "/articles",
        title: "articles:menu.articles",
        icon: Newspaper,
      },
    ],
  },
};
