/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Boom } from '@hapi/boom';
import NodeCache from '@cacheable/node-cache';
import makeWASocket, {
  delay,
  proto,
  WAMessageKey,
  WAMessageContent,
  DisconnectReason,
  AnyMessageContent,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from 'baileys';

import * as qrcode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import P from 'pino';

@Injectable()
export class AppService implements OnModuleInit {
  getHello(): string {
    return 'Hello World!';
  }

  private logger = new Logger(AppService.name);
  private readonly loggerSave = P(
    { timestamp: () => `,"time":"${new Date().toJSON()}"` },
    P.destination('./wa-logs.txt'),
  );
  private sock: ReturnType<typeof makeWASocket> | null = null;
  private msgRetryCounterCache = new NodeCache() as unknown as undefined;
  private currentQr: string | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  onModuleInit() {
    this.logger.log('Starting Whatsapp Service');
    this.startSock();
  }

  async startSock() {
    try {
      const { state, saveCreds } =
        await useMultiFileAuthState('baileys_auth_info');
      const { version } = await fetchLatestBaileysVersion();

      const sock = makeWASocket({
        version: version,
        logger: this.loggerSave,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys),
        },
        msgRetryCounterCache: this.msgRetryCounterCache,
        generateHighQualityLinkPreview: true,
        getMessage: this.getMessage,
      });

      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // Handle QR code generation
        if (qr) {
          try {
            const qrDataUrl = await qrcode.toDataURL(qr);
            this.currentQr = qrDataUrl;
            this.logger.log('QR Code generated successfully');
          } catch (err) {
            this.logger.error('QR generation error:', err);
          }
        }

        // Handle successful connection
        if (connection === 'open') {
          this.currentQr = null;
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.logger.log('Connected to WhatsApp');
        }

        // Handle connection close
        if (connection === 'close') {
          this.isConnected = false;
          const shouldReconnect = lastDisconnect?.error as Boom;
          const statusCode = shouldReconnect?.output?.statusCode;

          switch (statusCode) {
            case DisconnectReason.badSession:
              await this.clearAuthAndRestart();
              break;

            case DisconnectReason.connectionClosed:
              await this.reconnectWithDelay();
              break;

            case DisconnectReason.connectionLost:
              await this.reconnectWithDelay();
              break;

            case DisconnectReason.connectionReplaced:
              await this.clearAuthAndRestart();
              break;

            case DisconnectReason.loggedOut:
              await this.clearAuthAndRestart();
              break;

            case DisconnectReason.restartRequired:
              await this.reconnectWithDelay();
              break;

            case DisconnectReason.timedOut:
              await this.reconnectWithDelay();
              break;

            default:
              await this.reconnectWithDelay();
              break;
          }
        }

        // Handle connecting state
        if (connection === 'connecting') {
          this.logger.log('Connecting to WhatsApp');
        }
      });

      sock.ev.on('creds.update', saveCreds);

      this.sock = sock;
    } catch (error) {
      this.logger.error('Error starting socket:', error);
      await this.reconnectWithDelay();
    }
  }

  private async reconnectWithDelay() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      await this.clearAuthAndRestart();
      return;
    }

    this.reconnectAttempts++;
    setTimeout(() => {
      this.startSock();
    }, this.reconnectDelay);
  }

  private async clearAuthAndRestart() {
    try {
      this.logger.log('Clearing authentication data...');

      // Clear current QR and connection state
      this.currentQr = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;

      // Close existing socket
      if (this.sock) {
        this.sock.end(undefined);
        this.sock = null;
      }

      // Remove auth folder
      const authPath = path.resolve('baileys_auth_info');
      if (fs.existsSync(authPath)) {
        fs.rmSync(authPath, { recursive: true, force: true });
        this.logger.log('Auth data cleared');
      }

      // Wait a bit before restarting
      await new Promise((resolve) => setTimeout(resolve, 2000));

      this.logger.log('Starting fresh connection...');
      this.startSock();
    } catch (error) {
      this.logger.error('Error clearing auth:', error);
      // Force restart anyway
      setTimeout(() => this.startSock(), 5000);
    }
  }

  // Method to manually reset connection (bisa dipanggil dari controller)
  async resetConnection() {
    this.logger.log('Manual connection reset requested...');
    await this.clearAuthAndRestart();
  }

  // Method to get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      hasQr: !!this.currentQr,
      reconnectAttempts: this.reconnectAttempts,
      socketExists: !!this.sock,
    };
  }

  async sendMessageWithTyping(jid: string, message: AnyMessageContent) {
    if (!this.sock || !this.isConnected) {
      throw new Error('WhatsApp not connected');
    }

    try {
      await this.sock.presenceSubscribe(jid);
      await delay(500);

      await this.sock.sendPresenceUpdate('composing', jid);
      await delay(2000);

      await this.sock.sendPresenceUpdate('paused', jid);

      await this.sock.sendMessage(jid, message);
    } catch (error) {
      this.logger.error('Error sending message:', error);
      throw error;
    }
  }

  async getMessage(_key: WAMessageKey): Promise<WAMessageContent | undefined> {
    return Promise.resolve(proto.Message.fromObject({}));
  }

  getQr(): string | null {
    return this.currentQr;
  }
}
