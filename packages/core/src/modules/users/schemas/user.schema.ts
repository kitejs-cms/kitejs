import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types, Schema as SchemaDb } from "mongoose";
import { UserStatus } from "../models/user-status.enum";
import { CORE_NAMESPACE } from "../../../constants";

@Schema({
  collection: `${CORE_NAMESPACE}_users`,
  timestamps: true,
  toJSON: { getters: true },
})
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
    type: [{ type: SchemaDb.ObjectId, ref: "Role" }],
    default: [],
  })
  roles: Types.ObjectId[];

  @Prop({
    type: [{ type: SchemaDb.ObjectId, ref: "Permission" }],
    default: [],
  })
  permissions: Types.ObjectId[];

  @Prop({ type: String, required: false, default: null })
  loginAttempts: string | null;

  @Prop({
    _id: false,
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
