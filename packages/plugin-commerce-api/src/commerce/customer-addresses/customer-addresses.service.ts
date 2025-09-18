import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { CustomerAddress, CustomerAddressDocument } from "./schemas/customer-address.schema";
import { CreateCustomerAddressDto } from "./dto/create-customer-address.dto";
import { UpdateCustomerAddressDto } from "./dto/update-customer-address.dto";
import type { CustomerAddressResponseModel } from "./models/customer-address-response.model";

@Injectable()
export class CustomerAddressesService {
  constructor(
    @InjectModel(CustomerAddress.name)
    private readonly addressModel: Model<CustomerAddressDocument>
  ) {}

  private toModel(
    address: CustomerAddressDocument
  ): CustomerAddressResponseModel {
    const json = address.toJSON() as Record<string, unknown>;

    const asString = (value: unknown): string | undefined =>
      typeof value === "string" ? value : undefined;

    const requiredString = (value: unknown, fallback: string): string =>
      typeof value === "string" ? value : fallback;

    const asBoolean = (value: unknown, fallback: boolean): boolean =>
      typeof value === "boolean" ? value : fallback;

    return {
      id: address._id.toString(),
      userId: address.userId.toString(),
      label: asString(json.label) ?? address.label,
      firstName: asString(json.firstName) ?? address.firstName,
      lastName: asString(json.lastName) ?? address.lastName,
      company: asString(json.company) ?? address.company,
      address1: requiredString(json.address1, address.address1),
      address2: asString(json.address2) ?? address.address2,
      city: requiredString(json.city, address.city),
      postalCode: asString(json.postalCode) ?? address.postalCode,
      province: asString(json.province) ?? address.province,
      countryCode: requiredString(json.countryCode, address.countryCode),
      phone: asString(json.phone) ?? address.phone,
      isDefaultShipping: asBoolean(json.isDefaultShipping, address.isDefaultShipping),
      isDefaultBilling: asBoolean(json.isDefaultBilling, address.isDefaultBilling),
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    };
  }

  private async ensureDefaultUniqueness(address: CustomerAddressDocument) {
    const userId = address.userId;

    const updates: Promise<unknown>[] = [];
    if (address.isDefaultShipping) {
      updates.push(
        this.addressModel.updateMany(
          { userId, _id: { $ne: address._id } },
          { $set: { isDefaultShipping: false } }
        )
      );
    }

    if (address.isDefaultBilling) {
      updates.push(
        this.addressModel.updateMany(
          { userId, _id: { $ne: address._id } },
          { $set: { isDefaultBilling: false } }
        )
      );
    }

    if (updates.length) {
      await Promise.all(updates);
    }
  }

  async create(
    dto: CreateCustomerAddressDto
  ): Promise<CustomerAddressResponseModel> {
    const userId = new Types.ObjectId(dto.userId);
    const created = await this.addressModel.create({
      ...dto,
      userId,
      isDefaultShipping: dto.isDefaultShipping ?? false,
      isDefaultBilling: dto.isDefaultBilling ?? false,
    });

    await this.ensureDefaultUniqueness(created);

    return this.toModel(created);
  }

  async findForUser(
    userId: string
  ): Promise<CustomerAddressResponseModel[]> {
    const addresses = await this.addressModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: 1 })
      .exec();

    return addresses.map((address) => this.toModel(address));
  }

  async findOne(id: string): Promise<CustomerAddressResponseModel> {
    const address = await this.addressModel.findById(id).exec();

    if (!address) {
      throw new NotFoundException(`Customer address with ID ${id} not found`);
    }

    return this.toModel(address);
  }

  async update(
    id: string,
    dto: UpdateCustomerAddressDto
  ): Promise<CustomerAddressResponseModel> {
    const address = await this.addressModel.findById(id).exec();

    if (!address) {
      throw new NotFoundException(`Customer address with ID ${id} not found`);
    }

    if (dto.userId) {
      address.userId = new Types.ObjectId(dto.userId);
    }

    if (dto.label !== undefined) {
      address.label = dto.label;
    }

    if (dto.firstName !== undefined) {
      address.firstName = dto.firstName;
    }

    if (dto.lastName !== undefined) {
      address.lastName = dto.lastName;
    }

    if (dto.company !== undefined) {
      address.company = dto.company;
    }

    if (dto.address1 !== undefined) {
      address.address1 = dto.address1;
    }

    if (dto.address2 !== undefined) {
      address.address2 = dto.address2;
    }

    if (dto.city !== undefined) {
      address.city = dto.city;
    }

    if (dto.postalCode !== undefined) {
      address.postalCode = dto.postalCode;
    }

    if (dto.province !== undefined) {
      address.province = dto.province;
    }

    if (dto.countryCode !== undefined) {
      address.countryCode = dto.countryCode;
    }

    if (dto.phone !== undefined) {
      address.phone = dto.phone;
    }

    if (dto.isDefaultShipping !== undefined) {
      address.isDefaultShipping = dto.isDefaultShipping;
    }

    if (dto.isDefaultBilling !== undefined) {
      address.isDefaultBilling = dto.isDefaultBilling;
    }

    await address.save();
    await this.ensureDefaultUniqueness(address);

    return this.toModel(address);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.addressModel.findByIdAndDelete(id).exec();

    if (!deleted) {
      throw new NotFoundException(`Customer address with ID ${id} not found`);
    }
  }
}
