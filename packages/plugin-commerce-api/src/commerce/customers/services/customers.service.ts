import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { UpdateUserModel, UserResponseModel, UserService } from "@kitejs-cms/core";
import {
  CustomerAddress,
  CustomerAddressDocument,
} from "../schemas/customer-address.schema";
import {
  CreateCustomerDto,
  CustomerAddressDto,
} from "../dto/create-customer.dto";
import { UpdateCustomerDto } from "../dto/update-customer.dto";
import { CustomerResponseDto } from "../dto/customer-response.dto";

interface SanitizedAddress
  extends Omit<
    CustomerAddressDto,
    "id" | "isDefaultShipping" | "isDefaultBilling"
  > {
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

@Injectable()
export class CustomersService {
  constructor(
    private readonly userService: UserService,
    @InjectModel(CustomerAddress.name)
    private readonly addressModel: Model<CustomerAddressDocument>
  ) {}

  private sanitizeAddresses(
    addresses: CustomerAddressDto[] = []
  ): SanitizedAddress[] {
    const sanitized = addresses.map((address) => ({
      label: address.label,
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company,
      address1: address.address1,
      address2: address.address2,
      city: address.city,
      postalCode: address.postalCode,
      province: address.province,
      countryCode: address.countryCode,
      phone: address.phone,
      isDefaultShipping: address.isDefaultShipping ?? false,
      isDefaultBilling: address.isDefaultBilling ?? false,
    }));

    let defaultShippingSet = false;
    let defaultBillingSet = false;

    for (const address of sanitized) {
      if (address.isDefaultShipping) {
        if (!defaultShippingSet) {
          defaultShippingSet = true;
        } else {
          address.isDefaultShipping = false;
        }
      }

      if (address.isDefaultBilling) {
        if (!defaultBillingSet) {
          defaultBillingSet = true;
        } else {
          address.isDefaultBilling = false;
        }
      }
    }

    return sanitized;
  }

  private buildResponse(
    user: UserResponseModel,
    addresses: CustomerAddressDocument[]
  ): CustomerResponseDto {
    const serializedAddresses = addresses.map((address) => ({
      id: address._id.toString(),
      label: address.label,
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company,
      address1: address.address1,
      address2: address.address2,
      city: address.city,
      postalCode: address.postalCode,
      province: address.province,
      countryCode: address.countryCode,
      phone: address.phone,
      isDefaultShipping: address.isDefaultShipping,
      isDefaultBilling: address.isDefaultBilling,
    }));

    return new CustomerResponseDto({
      ...user,
      addresses: serializedAddresses,
    });
  }

  private async loadAddresses(userId: string): Promise<CustomerAddressDocument[]> {
    return this.addressModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: 1 })
      .exec();
  }

  private async replaceAddresses(
    userId: string,
    addresses: SanitizedAddress[]
  ): Promise<CustomerAddressDocument[]> {
    const objectId = new Types.ObjectId(userId);
    await this.addressModel.deleteMany({ userId: objectId }).exec();

    if (!addresses.length) {
      return [];
    }

    const docs = addresses.map((address) => ({
      ...address,
      userId: objectId,
    }));

    await this.addressModel.insertMany(docs);

    return this.loadAddresses(userId);
  }

  async create(dto: CreateCustomerDto): Promise<CustomerResponseDto> {
    const { addresses, status, ...userData } = dto;
    const sanitizedAddresses = this.sanitizeAddresses(addresses ?? []);

    const user = await this.userService.createUser(userData);

    if (!user) {
      throw new InternalServerErrorException("Unable to create customer");
    }

    let currentUser = user;
    if (status) {
      const updated = await this.userService.updateUser(user.id, { status });
      if (updated) {
        currentUser = updated;
      } else {
        currentUser = { ...user, status };
      }
    }

    const savedAddresses = await this.replaceAddresses(
      currentUser.id,
      sanitizedAddresses
    );

    return this.buildResponse(currentUser, savedAddresses);
  }

  async findAll(): Promise<CustomerResponseDto[]> {
    const total = await this.userService.countUsers();
    if (total === 0) {
      return [];
    }

    const users = await this.userService.findUsers(0, total, {
      createdAt: -1,
    });

    const ids = users.map((user) => new Types.ObjectId(user.id));
    const addresses = await this.addressModel
      .find({ userId: { $in: ids } })
      .sort({ createdAt: 1 })
      .exec();

    const grouped = new Map<string, CustomerAddressDocument[]>();
    for (const address of addresses) {
      const key = address.userId.toString();
      const existing = grouped.get(key);
      if (existing) {
        existing.push(address);
      } else {
        grouped.set(key, [address]);
      }
    }

    return users.map((user) =>
      this.buildResponse(user, grouped.get(user.id) ?? [])
    );
  }

  async findOne(id: string): Promise<CustomerResponseDto> {
    const user = await this.userService.findUser(id);
    if (!user) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    const addresses = await this.loadAddresses(id);
    return this.buildResponse(user, addresses);
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<CustomerResponseDto> {
    const { addresses, password, status, ...rest } = dto;

    const updatePayload: UpdateUserModel = { ...rest } as UpdateUserModel;
    if (status) {
      updatePayload.status = status;
    }

    if (Object.keys(updatePayload).length > 0) {
      await this.userService.updateUser(id, updatePayload);
    }

    if (password) {
      await this.userService.updateUserPassword(id, password);
    }

    let savedAddresses: CustomerAddressDocument[] | undefined;
    if (addresses) {
      const sanitizedAddresses = this.sanitizeAddresses(addresses);
      savedAddresses = await this.replaceAddresses(id, sanitizedAddresses);
    }

    const user = await this.userService.findUser(id);
    if (!user) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    const finalAddresses = savedAddresses ?? (await this.loadAddresses(id));
    return this.buildResponse(user, finalAddresses);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.userService.deleteUser(id);
    if (!deleted) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    await this.addressModel.deleteMany({ userId: new Types.ObjectId(id) }).exec();
  }
}
