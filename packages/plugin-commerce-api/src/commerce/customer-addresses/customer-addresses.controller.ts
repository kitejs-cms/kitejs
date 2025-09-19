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
}
