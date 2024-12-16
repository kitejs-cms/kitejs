import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { UserStatus } from "../models/user-status.enum";

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String, required: true })
  firstName: string;

  @Prop({ type: String, required: true })
  lastName: string;

  @Prop({
    type: String,
    enum: UserStatus,
    default: UserStatus.INACTIVE,
  })
  status: UserStatus;

  @Prop({ type: Date, default: null })
  deletedAt: Date;

  @Prop({
    type: [{ type: Types.ObjectId, ref: "Role" }],
    default: [],
  })
  roles: Types.ObjectId[];

  @Prop({
    type: [{ type: Types.ObjectId, ref: "Permission" }],
    default: [],
  })
  permissions: Types.ObjectId[];

  @Prop({
    type: [
      {
        consentType: { type: String, required: true },
        given: { type: Boolean, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  consents: Array<{ consentType: string; given: boolean; timestamp: Date }>;
}

export const UserSchema = SchemaFactory.createForClass(User);
