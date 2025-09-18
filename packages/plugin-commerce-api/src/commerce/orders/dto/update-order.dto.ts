import { PartialType } from "@nestjs/swagger";
import { CreateOrderDto } from "./create-order.dto";

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  constructor(partial: UpdateOrderDto) {
    super(partial);
  }
}
