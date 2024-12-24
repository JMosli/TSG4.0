import { Injectable, Logger } from '@nestjs/common';
import FormData from 'form-data';
import { readFile } from 'fs/promises';
import Handlebars from 'handlebars';
import Mailgun, { MailgunMessageData } from 'mailgun.js';
import { IMailgunClient } from 'mailgun.js/Interfaces';
import path from 'path';

const hbs = ['media.hbs'];

@Injectable()
export class MailingService {
  logger: Logger = new Logger(MailingService.name);

  requester: Mailgun = new Mailgun(FormData);
  domain: string = process.env.MAILGUN_DOMAIN;
  mailgun: IMailgunClient;

  templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    if (!process.env.MAILGUN_SECRET)
      throw new Error('No mailgun secret found in environment!');

    this.mailgun = this.requester.client({
      username: 'api',
      key: process.env.MAILGUN_SECRET,
    });

    this.compileHandlebars();
  }

  /**
   * Loads all mailing templates
   */
  async compileHandlebars() {
    const files = hbs.map((h) => [
      path.resolve(process.cwd(), 'handlebars', h),
      h,
    ]);

    for (const [file, name] of files) {
      const source = await readFile(file);
      this.templates.set(name, Handlebars.compile(source.toString()));
    }

    this.logger.debug(`Loaded ${this.templates.size} mailing templates`);
  }

  /**
   * Creates a new mailgun message and returns it
   */
  createMessage(data: MailgunMessageData) {
    return this.mailgun.messages.create(this.domain, {
      from: `The shooting gallery <tsg@${this.domain}>`,
      ...data,
    });
  }

  /**
   * Renders a template
   */
  renderTemplate(template: string, data: object) {
    const delegate = this.templates.get(template);
    if (!delegate) return null;

    return delegate(data);
  }
}
