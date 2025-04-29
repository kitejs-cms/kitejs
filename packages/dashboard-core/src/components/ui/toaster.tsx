import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:border-l-4",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:border-l-green-500 group-[.toaster]:bg-green-50/50 dark:group-[.toaster]:bg-green-900/20",
          error:
            "group-[.toaster]:border-l-red-500 group-[.toaster]:bg-red-50/50 dark:group-[.toaster]:bg-red-900/20",
          warning:
            "group-[.toaster]:border-l-yellow-500 group-[.toaster]:bg-yellow-50/50 dark:group-[.toaster]:bg-yellow-900/20",
          info: "group-[.toaster]:border-l-blue-500 group-[.toaster]:bg-blue-50/50 dark:group-[.toaster]:bg-blue-900/20",
          loading:
            "group-[.toaster]:border-l-gray-500 group-[.toaster]:bg-gray-50/50 dark:group-[.toaster]:bg-gray-900/20",

          icon: "group-[.toast]:scale-125",
        },
      }}
      richColors
      {...props}
    />
  );
};

export { Toaster };
