import React from "react";

type SEOProps = {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
};

export default function MainLayout({
  seo,
  children,
}: {
  seo: SEOProps;
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        {seo.keywords && <meta name="keywords" content={seo.keywords} />}
        {seo.ogImage && <meta property="og:image" content={seo.ogImage} />}
      </head>

      <body>
        <header>Header Component</header>
        <main id="app">{children}</main>
        <footer>Footer Component</footer>
        <script src="/assets/home.bundle.js"></script>

        {/* Script WebSocket per il live reload */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              const socket = new WebSocket("ws://localhost:3001/reload");
              socket.onmessage = (event) => {
                if (event.data === "reload") {
                  console.log("🔄 Reloading page...");
                  location.reload();
                }
              };
              socket.onclose = () => {
                console.log("🔌 WebSocket connection closed");
              };
            `,
          }}
        />
      </body>
    </html>
  );
}
