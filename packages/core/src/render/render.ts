import { ReactNode } from "react";
import ReactDOMServer from "react-dom/server";

type ComponentProps = Record<string, any>;

type LayoutItem = {
  component: string;
  props: ComponentProps;
};

type ComponentsMap = Record<string, ReactNode>;

export function renderPage(
  layout: LayoutItem[],
  components: ComponentsMap
): string {
  return layout
    .map(({ component, props }) => {
      const Component = components[component];
      if (!Component) {
        throw new Error(`Component "${component}" not found`);
      }
      return ReactDOMServer.renderToString(Component);
    })
    .join("");
}
