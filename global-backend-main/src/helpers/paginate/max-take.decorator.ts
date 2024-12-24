import { applyDecorators, SetMetadata, UseGuards } from "@nestjs/common";
import { MaxTakeGuard } from "./max-take.guard";

export const MAX_TAKE_KEY = "max_take";

/**
 * Limits maximum number of *take* parameter.
 * @param maxTake maximum *take* parameter for pagination
 */
export const MaxTake = (maxTake: number) =>
  applyDecorators(SetMetadata(MAX_TAKE_KEY, maxTake), UseGuards(MaxTakeGuard));
