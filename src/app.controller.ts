import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  /**
   * Welcome message
   * @returns Welcome message
   */
  @Get()
  getHello() {
    return { message: 'Welcome to Enigma Sento Backend' };
  }
}
