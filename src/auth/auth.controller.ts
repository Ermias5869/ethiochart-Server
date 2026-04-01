import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(@Body() dto: LoginDto) {
    return this.authService.adminLogin(dto);
  }

  @Public()
  @Post('doctor/login')
  @HttpCode(HttpStatus.OK)
  async doctorLogin(@Body() dto: LoginDto) {
    return this.authService.doctorLogin(dto);
  }

  @Public()
  @Post('patient/login')
  @HttpCode(HttpStatus.OK)
  async patientLogin(@Body() dto: LoginDto) {
    return this.authService.patientLogin(dto);
  }
}
