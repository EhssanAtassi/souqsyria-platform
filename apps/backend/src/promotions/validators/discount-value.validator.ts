import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'discountValue', async: false })
export class DiscountValueValidator implements ValidatorConstraintInterface {
  validate(value: number, args: ValidationArguments) {
    const obj: any = args.object;
    if (obj.discountType === 'percentage') {
      return value >= 0 && value <= 100;
    }
    if (obj.discountType === 'fixed') {
      return value > 0;
    }
    return false;
  }

  defaultMessage(args: ValidationArguments) {
    const obj: any = args.object;
    if (obj.discountType === 'percentage') {
      return 'Percentage discount must be between 0 and 100';
    }
    if (obj.discountType === 'fixed') {
      return 'Fixed discount must be greater than 0';
    }
    return 'Invalid discount';
  }
}
