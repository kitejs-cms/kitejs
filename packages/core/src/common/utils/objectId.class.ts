import { Types } from "mongoose";

export class ObjectIdUtils {
  /**
   * Converts a string to an ObjectId after validating it.
   * @param id The string to convert.
   * @returns A valid Types.ObjectId instance.
   * @throws An error if the string is not valid.
   */
  static toObjectId(id: string): Types.ObjectId {
    if (!id) {
      throw new Error("ID cannot be empty");
    }

    if (!Types.ObjectId.isValid(id)) {
      throw new Error(`Invalid ObjectId: ${id}`);
    }

    // Return the new ObjectId
    return new Types.ObjectId(id);
  }
}
