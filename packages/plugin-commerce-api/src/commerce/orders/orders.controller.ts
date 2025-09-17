import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import {
  JwtAuthGuard,
  PermissionsGuard,
  Permissions,
  ValidateObjectIdPipe,
} from "@kitejs-cms/core";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { COMMERCE_PLUGIN_NAMESPACE } from "../../constants";

@ApiTags("Commerce - Orders")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("commerce/orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Permissions(`${COMMERCE_PLUGIN_NAMESPACE}:orders.create`)
  @ApiOperation({ summary: "Create a new order" })
  @ApiResponse({ status: 201, description: "Order created" })
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get()
  @Permissions(`${COMMERCE_PLUGIN_NAMESPACE}:orders.read`)
  @ApiOperation({ summary: "List orders" })
  @ApiResponse({ status: 200, description: "List of orders" })
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(":id")
  @Permissions(`${COMMERCE_PLUGIN_NAMESPACE}:orders.read`)
  @ApiOperation({ summary: "Retrieve an order" })
  @ApiResponse({ status: 200, description: "Order detail" })
  findOne(@Param("id", ValidateObjectIdPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(":id")
  @Permissions(`${COMMERCE_PLUGIN_NAMESPACE}:orders.update`)
  @ApiOperation({ summary: "Update an order" })
  @ApiResponse({ status: 200, description: "Order updated" })
  update(
    @Param("id", ValidateObjectIdPipe) id: string,
    @Body() dto: UpdateOrderDto
  ) {
    return this.ordersService.update(id, dto);
  }

  @Delete(":id")
  @Permissions(`${COMMERCE_PLUGIN_NAMESPACE}:orders.delete`)
  @ApiOperation({ summary: "Delete an order" })
  @ApiResponse({ status: 204, description: "Order deleted" })
  async remove(@Param("id", ValidateObjectIdPipe) id: string) {
    await this.ordersService.remove(id);
    return { status: "ok" };
  }
}
