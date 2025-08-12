import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { addDays } from 'date-fns';
import { SignInAuthRequestDto } from './dto/signIn-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly user: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(payload: SignInAuthRequestDto) {
    const user = await this.user.findOneByUsername(payload.username);
    if (!user) throw new UnauthorizedException('Invalid username or password');
    const isValid = await Bun.password.verify(payload.password, user.password);
    if (!isValid)
      throw new UnauthorizedException('Invalid username or password');
    const token = await this.jwtService.signAsync({
      sub: user.id,
      role: user.role,
      name: user.displayName,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(addDays(new Date(), 3).getTime() / 1000),
    });
    return {
      token,
      user: { id: user.id, displayName: user.displayName, role: user.role },
    };
  }
}
