import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Customer, CustomerDocument } from "../schemas/customer.schema";
import { CreateCustomerDto, CustomerAddressDto } from "../dto/create-customer.dto";
import { UpdateCustomerDto } from "../dto/update-customer.dto";
import { CustomerLifecycleStage } from "../models/customer-lifecycle-stage.enum";

interface SanitizedAddressesResult {
  addresses: (CustomerAddressDto & { _id: Types.ObjectId })[];
  defaultShipping?: Types.ObjectId;
  defaultBilling?: Types.ObjectId;
}

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>
  ) {}

  private sanitizeAddresses(
    addresses: CustomerAddressDto[] = []
  ): SanitizedAddressesResult {
    const sanitized = addresses.map((address) => ({
      _id: address.id ? new Types.ObjectId(address.id) : new Types.ObjectId(),
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

    let defaultShipping: Types.ObjectId | undefined;
    let defaultBilling: Types.ObjectId | undefined;

    for (const address of sanitized) {
      if (address.isDefaultShipping) {
        if (!defaultShipping) {
          defaultShipping = address._id;
        } else {
          address.isDefaultShipping = false;
        }
      }
      if (address.isDefaultBilling) {
        if (!defaultBilling) {
          defaultBilling = address._id;
        } else {
          address.isDefaultBilling = false;
        }
      }
    }

    return { addresses: sanitized, defaultShipping, defaultBilling };
  }

  async create(dto: CreateCustomerDto): Promise<CustomerDocument> {
    const { addresses, ...rest } = dto;
    const sanitizedAddresses = this.sanitizeAddresses(addresses ?? []);

    return this.customerModel.create({
      ...rest,
      tags: rest.tags ?? [],
      lifecycleStage: rest.lifecycleStage ?? CustomerLifecycleStage.Lead,
      addresses: sanitizedAddresses.addresses,
      defaultShippingAddressId: sanitizedAddresses.defaultShipping,
      defaultBillingAddressId: sanitizedAddresses.defaultBilling,
    });
  }

  async findAll(): Promise<CustomerDocument[]> {
    return this.customerModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<CustomerDocument> {
    const customer = await this.customerModel.findById(id).exec();
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<CustomerDocument> {
    const { addresses, ...rest } = dto;
    const updateData: Record<string, unknown> = { ...rest };

    if (addresses) {
      const sanitizedAddresses = this.sanitizeAddresses(addresses);
      updateData.addresses = sanitizedAddresses.addresses;
      updateData.defaultShippingAddressId = sanitizedAddresses.defaultShipping;
      updateData.defaultBillingAddressId = sanitizedAddresses.defaultBilling;
    }

    const customer = await this.customerModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .exec();

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async remove(id: string): Promise<void> {
    const result = await this.customerModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
  }
}
