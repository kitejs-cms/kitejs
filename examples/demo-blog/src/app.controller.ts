import { Controller, Get, Param, Res } from "@nestjs/common";
import { Response } from "express";
import fs from "fs";
import path from "path";
import React, { createElement } from "react";
import { renderToPipeableStream } from "react-dom/server";
import Home from "./theme/pages/home";

@Controller()
export class AppController {
  private getTemplate(): string {
    return fs.readFileSync(
      path.join(process.cwd(), "dist/examples/demo-blog/theme/index.html"),
      "utf8"
    );
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
    const template = this.getTemplate();

    const lang = "en";
    const title = `Title for ${page}`;
    const description = `Description for ${page}`;
    const keywords = "example, keywords";
    const ogImage = "/assets/example-image.png";
    const bundle = this.getLatestBundle();

    // Preparazione del rendering
    const [start, end] = template.split('<div id="app"></div>');

    res.setHeader("Content-Type", "text/html");

    // Inizia lo streaming del layout HTML
    res.write(
      start
        .replace("%LANG%", lang)
        .replace("%TITLE%", title)
        .replace("%DESCRIPTION%", description)
        .replace("%KEYWORDS%", keywords)
        .replace("%OG_IMAGE%", ogImage) + `<div id="app">` // Crea il div root per React
    );

    // Streaming del contenuto React
    const { pipe } = renderToPipeableStream(createElement(Home), {
      onShellReady() {
        pipe(res); // Invia il contenuto React
      },
      onAllReady() {
        res.write(`</div>`); // Chiude il div root
        res.write(end.replace("%BUNDLE%", bundle)); // Completa il layout HTML
        res.end();
      },
      onError(error) {
        console.error("Rendering error:", error);
        res.status(500).send("Internal Server Error");
      },
    });
  }
}
