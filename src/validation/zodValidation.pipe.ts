import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodType } from 'zod/v4';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}
  transform(value: any) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Validation failed', { cause: error });
    }
  }
}
