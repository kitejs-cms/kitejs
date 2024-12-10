import { Controller, Get, Param, Res, Logger } from "@nestjs/common";
import { renderToPipeableStream } from "react-dom/server";
import React, { createElement } from "react";
import { Response } from "express";
import fs from "fs";
import path from "path";

@Controller()
export class AppController {
  private logger = new Logger(AppController.name);

  private pages: Record<string, React.FC>;
  private template: string;

  constructor() {
    this.template = fs.readFileSync(
      path.join(process.cwd(), "dist/examples/demo-blog/theme/index.html"),
      "utf8"
    );

    const pagesDir = path.resolve(
      process.cwd(),
      "dist/examples/demo-blog/theme/pages"
    );
    this.pages = {};

    fs.readdirSync(pagesDir).forEach((file) => {
      if (file.endsWith(".js") || file.endsWith(".jsx")) {
        const pageName = path.basename(file, path.extname(file));
        const modulePath = path.join(pagesDir, file);
        try {
          const module = require(modulePath);
          if (module.default) {
            this.pages[pageName] = module.default;
          } else {
            this.logger.warn(
              `⚠️ The module ${modulePath} does not have a default export.`
            );
          }
        } catch (error) {
          this.logger.error(`❌ Unable to load module ${modulePath}:`, error);
        }
      }
    });

    this.logger.log("Loaded pages:", Object.keys(this.pages));
  }
  private getLatestBundle(): string {
    const assetsDir = path.resolve(
      process.cwd(),
      "dist/examples/demo-blog/theme/assets"
    );
    const files = fs.readdirSync(assetsDir);
    const bundle = files.find(
      (file) => file.startsWith("bundle.") && file.endsWith(".js")
    );
    if (!bundle) {
      throw new Error("Bundle not found");
    }
    return `/assets/${bundle}`;
  }

  @Get("/:page?")
  renderPage(@Param("page") page: string = "home", @Res() res: Response) {
    const lang = "en";
    const title = `Title for ${page}`;
    const description = `Description for ${page}`;
    const keywords = "example, keywords";
    const ogImage = "/assets/example-image.png";
    const bundle = this.getLatestBundle();

    const PageComponent = this.pages[page];

    if (!PageComponent) {
      res.status(404).send("Page not found");
      return;
    }

    const [start, end] = this.template.split('<div id="app"></div>');

    res.setHeader("Content-Type", "text/html");

    res.write(
      start
        .replace("%LANG%", lang)
        .replace("%TITLE%", title)
        .replace("%DESCRIPTION%", description)
        .replace("%KEYWORDS%", keywords)
        .replace("%OG_IMAGE%", ogImage) + `<div id="app" data-page="${page}">`
    );

    const { pipe } = renderToPipeableStream(createElement(PageComponent), {
      onShellReady() {
        pipe(res);
      },
      onAllReady() {
        res.write(`</div>`);
        res.write(end.replace("%BUNDLE%", bundle));
        res.end();
      },
      onError(error: any) {
        console.error("Rendering error:", error);
        res.status(500).send("Internal Server Error");
      },
    });
  }
}
