/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Post,
  StreamableFile,
} from '@nestjs/common';
import { AppService } from './app.service';
import { ApiProduces, ApiResponse } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // @Get()
  // getHello(): string {
  //   return this.appService.getHello();
  // }

  @Get('qr')
  @ApiProduces('image/png')
  @ApiResponse({
    status: 200,
    description: 'WhatsApp QR Code image in PNG format',
    content: {
      'image/png': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @Header('Content-Type', 'image/png')
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate') // QR code shouldn't be cached
  @Header('Content-Disposition', 'inline; filename="whatsapp-qr.png"')
  getQrData() {
    try {
      const qrDataUrl = this.appService.getQr();
      const status = this.appService.getConnectionStatus();

      if (status.isConnected) {
        throw new BadRequestException('WhatsApp is already connected.');
      }

      if (!qrDataUrl) {
        throw new BadRequestException(
          'QR code not available. Please ensure WhatsApp service is starting or needs authentication.',
        );
      }

      // Extract base64 from Data URL
      const base64Data = qrDataUrl.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      return new StreamableFile(buffer);
    } catch (error: any) {
      throw new BadRequestException(`Failed to get QR code: ${error.message}`);
    }
  }

  @Get('conection-status')
  getQrStatus() {
    const status = this.appService.getConnectionStatus();
    return {
      hasQr: status.hasQr,
      isConnected: status.isConnected,
      message: status.hasQr
        ? 'QR code available'
        : status.isConnected
          ? 'Already connected'
          : 'Connecting...',
      timestamp: new Date().toISOString(),
    };
  }

  // reset whatsapp only admin in the feature
  @Post('reset')
  async resetConnection() {
    try {
      await this.appService.resetConnection();
      return {
        success: true,
        message: 'Connection reset initiated',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('send-message')
  async sendMessage(@Body() body: { jid: string; message: string }) {
    try {
      await this.appService.sendMessageWithTyping(body.jid, {
        text: body.message,
      });
      return {
        success: true,
        message: 'Message sent successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // @Get("message")
  // async getMessage(@Body() body: { key: string }) {
  //   try {
  //     const message = await this.appService.getMessage(body.key);
  //     return {
  //       success: true,
  //       message: message,
  //       timestamp: new Date().toISOString(),
  //     };
  //   } catch (error: any) {
  //     return {
  //       success: false,
  //       error: error.message,
  //       timestamp: new Date().toISOString(),
  //     };
  //   }
  // }
}
