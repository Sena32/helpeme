import { Allow } from 'class-validator';
import { NewAccountDto } from '../../users/dto/new-account.dto';

export class RegisterDto extends NewAccountDto {
  // RN-03/AC-04: accepted so the request is not rejected, but never forwarded (always USER).
  @Allow()
  role?: unknown;
}
