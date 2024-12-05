import { Controller, Get, Param, Res, NotFoundException } from "@nestjs/common";
import { Response } from "express";
import React, { createElement } from "react";
import ReactDOMServer from "react-dom/server";
import fs from "fs";
import path from "path";
import Home from "./theme/pages/home";

@Controller()
export class AppController {
  @Get("/:page?")
  render(@Param("page") page: string = "index", @Res() res: Response) {
    // Renderizza il contenuto dinamico
    const html = ReactDOMServer.renderToString(createElement(Home));

    // Invia la risposta al client
    res.send(html);
  }
}
