import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ _id: false })
export class OrderAddress {
  @Prop({ type: String, required: false })
  firstName?: string;

  @Prop({ type: String, required: false })
  lastName?: string;

  @Prop({ type: String, required: false })
  company?: string;

  @Prop({ type: String, required: true })
  address1!: string;

  @Prop({ type: String, required: false })
  address2?: string;

  @Prop({ type: String, required: true })
  city!: string;

  @Prop({ type: String, required: false })
  postalCode?: string;

  @Prop({ type: String, required: false })
  province?: string;

  @Prop({ type: String, required: true })
  countryCode!: string;

  @Prop({ type: String, required: false })
  phone?: string;
}

export const OrderAddressSchema = SchemaFactory.createForClass(OrderAddress);
