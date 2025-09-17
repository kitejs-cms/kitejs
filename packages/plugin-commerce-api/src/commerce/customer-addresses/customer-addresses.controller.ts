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
import { COMMERCE_PLUGIN_NAMESPACE } from "../../constants";
import { CustomerAddressesService } from "./customer-addresses.service";
import { CreateCustomerAddressDto } from "./dto/create-customer-address.dto";
import { CustomerAddressResponseDto } from "./dto/customer-address-response.dto";
import { UpdateCustomerAddressDto } from "./dto/update-customer-address.dto";

@ApiTags("Commerce - Customer Addresses")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("commerce/customer-addresses")
export class CustomerAddressesController {
  constructor(
    private readonly customerAddressesService: CustomerAddressesService
  ) {}

  @Post()
  @Permissions(`${COMMERCE_PLUGIN_NAMESPACE}:customer-addresses.create`)
  @ApiOperation({ summary: "Create a customer address" })
  @ApiResponse({
    status: 201,
    description: "Customer address created",
    type: CustomerAddressResponseDto,
  })
  create(
    @Body() dto: CreateCustomerAddressDto
  ): Promise<CustomerAddressResponseDto> {
    return this.customerAddressesService.create(dto);
  }

  @Get("user/:userId")
  @Permissions(`${COMMERCE_PLUGIN_NAMESPACE}:customer-addresses.read`)
  @ApiOperation({ summary: "List addresses for a customer" })
  @ApiResponse({
    status: 200,
    description: "Customer addresses",
    type: [CustomerAddressResponseDto],
  })
  findForUser(
    @Param("userId", ValidateObjectIdPipe) userId: string
  ): Promise<CustomerAddressResponseDto[]> {
    return this.customerAddressesService.findForUser(userId);
  }

  @Get(":id")
  @Permissions(`${COMMERCE_PLUGIN_NAMESPACE}:customer-addresses.read`)
  @ApiOperation({ summary: "Retrieve a customer address" })
  @ApiResponse({
    status: 200,
    description: "Customer address detail",
    type: CustomerAddressResponseDto,
  })
  findOne(
    @Param("id", ValidateObjectIdPipe) id: string
  ): Promise<CustomerAddressResponseDto> {
    return this.customerAddressesService.findOne(id);
  }

  @Patch(":id")
  @Permissions(`${COMMERCE_PLUGIN_NAMESPACE}:customer-addresses.update`)
  @ApiOperation({ summary: "Update a customer address" })
  @ApiResponse({
    status: 200,
    description: "Customer address updated",
    type: CustomerAddressResponseDto,
  })
  update(
    @Param("id", ValidateObjectIdPipe) id: string,
    @Body() dto: UpdateCustomerAddressDto
  ): Promise<CustomerAddressResponseDto> {
    return this.customerAddressesService.update(id, dto);
  }

  @Delete(":id")
  @Permissions(`${COMMERCE_PLUGIN_NAMESPACE}:customer-addresses.delete`)
  @ApiOperation({ summary: "Delete a customer address" })
  @ApiResponse({ status: 204, description: "Customer address deleted" })
  async remove(@Param("id", ValidateObjectIdPipe) id: string) {
    await this.customerAddressesService.remove(id);
    return { status: "ok" };
  }
}
