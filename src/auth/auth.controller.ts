import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  SignInAuthRequestDto,
  SignInAuthResponseDto,
} from './dto/signIn-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Sign in
   */
  @Post('sign-in')
  async signIn(
    @Body() signInAuthDto: SignInAuthRequestDto,
  ): Promise<SignInAuthResponseDto> {
    const data = await this.authService.signIn(signInAuthDto);
    return { message: 'success', data };
  }
}
