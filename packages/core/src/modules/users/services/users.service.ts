import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "../schemas/user.schema";

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  /**
   * Creates a new user.
   * @param userData Data for the new user.
   * @returns The created user.
   * @throws BadRequestException if the user cannot be created.
   */
  async createUser(userData: Partial<User>): Promise<User> {
    try {
      const user = new this.userModel(userData);
      return await user.save();
    } catch (error) {
      throw new BadRequestException("Failed to create the user.");
    }
  }

  /**
   * Retrieves all users.
   * @returns An array of users.
   */
  async findUsers(status: string | undefined): Promise<User[]> {
    return await this.userModel.find({});
  }

  /**
   * Retrieves a user by ID.
   * @param id The user ID.
   * @returns The user.
   * @throws NotFoundException if the user is not found.
   */
  async findUserById(id: string): Promise<User | null> {
    const user = await this.userModel
      .findById(id)
      .populate("roles permissions")
      .exec();
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }
    return user;
  }

  /**
   * Updates a user.
   * @param id The user ID.
   * @param updateData Data to update.
   * @returns The updated user.
   * @throws NotFoundException if the user is not found.
   * @throws BadRequestException if the update fails.
   */
  async updateUser(
    id: string,
    updateData: Partial<User>
  ): Promise<User | null> {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }
    return user;
  }

  /**
   * Deletes a user.
   * @param id The user ID.
   * @throws NotFoundException if the user is not found.
   */
  async deleteUser(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }
  }

  /**
   * Updates user consents.
   * @param userId The user ID.
   * @param consents Array of consents to update.
   * @returns The updated user.
   * @throws NotFoundException if the user is not found.
   */
  async updateUserConsents(
    userId: string,
    consents: Array<{ consentType: string; given: boolean }>
  ): Promise<User | null> {
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          $set: {
            consents: consents.map((c) => ({ ...c, timestamp: new Date() })),
          },
        },
        { new: true }
      )
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found.`);
    }
    return user;
  }
}
