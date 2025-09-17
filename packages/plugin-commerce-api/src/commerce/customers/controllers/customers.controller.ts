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
import { CustomersService } from "../services/customers.service";
import { CreateCustomerDto } from "../dto/create-customer.dto";
import { UpdateCustomerDto } from "../dto/update-customer.dto";
import { CustomerResponseDto } from "../dto/customer-response.dto";
import { COMMERCE_PLUGIN_NAMESPACE } from "../../../constants";

@ApiTags("Commerce - Customers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("commerce/customers")
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Permissions(`${COMMERCE_PLUGIN_NAMESPACE}:customers.create`)
  @ApiOperation({ summary: "Create a new customer" })
  @ApiResponse({
    status: 201,
    description: "Customer created",
    type: CustomerResponseDto,
  })
  create(@Body() dto: CreateCustomerDto): Promise<CustomerResponseDto> {
    return this.customersService.create(dto);
  }

  @Get()
  @Permissions(`${COMMERCE_PLUGIN_NAMESPACE}:customers.read`)
  @ApiOperation({ summary: "List customers" })
  @ApiResponse({
    status: 200,
    description: "List of customers",
    type: [CustomerResponseDto],
  })
  findAll(): Promise<CustomerResponseDto[]> {
    return this.customersService.findAll();
  }

  @Get(":id")
  @Permissions(`${COMMERCE_PLUGIN_NAMESPACE}:customers.read`)
  @ApiOperation({ summary: "Retrieve a customer" })
  @ApiResponse({
    status: 200,
    description: "Customer detail",
    type: CustomerResponseDto,
  })
  findOne(
    @Param("id", ValidateObjectIdPipe) id: string
  ): Promise<CustomerResponseDto> {
    return this.customersService.findOne(id);
  }

  @Patch(":id")
  @Permissions(`${COMMERCE_PLUGIN_NAMESPACE}:customers.update`)
  @ApiOperation({ summary: "Update a customer" })
  @ApiResponse({
    status: 200,
    description: "Customer updated",
    type: CustomerResponseDto,
  })
  update(
    @Param("id", ValidateObjectIdPipe) id: string,
    @Body() dto: UpdateCustomerDto
  ): Promise<CustomerResponseDto> {
    return this.customersService.update(id, dto);
  }

  @Delete(":id")
  @Permissions(`${COMMERCE_PLUGIN_NAMESPACE}:customers.delete`)
  @ApiOperation({ summary: "Delete a customer" })
  @ApiResponse({ status: 204, description: "Customer deleted" })
  async remove(@Param("id", ValidateObjectIdPipe) id: string) {
    await this.customersService.remove(id);
    return { status: "ok" };
  }
}
