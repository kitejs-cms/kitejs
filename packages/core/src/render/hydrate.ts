import { ReactNode } from "react";
import { hydrateRoot } from "react-dom/client";

type ComponentProps = Record<string, any>;

type LayoutItem = {
  component: string;
  props: ComponentProps;
};

type ComponentsMap = Record<string, ReactNode>;

export function hydratePage(
  layout: LayoutItem[],
  components: ComponentsMap
): void {
  layout.forEach(({ component, props }, index) => {
    const Component = components[component];
    if (!Component) {
      console.warn(`Component "${component}" not found`);
      return;
    }

    const container = document.getElementById(`component-${index}`);
    if (container) {
      hydrateRoot(container, Component);
    }
  });
}
