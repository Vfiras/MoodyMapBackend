import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter;

  constructor() {
    // Create reusable transporter object using the default SMTP transport
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER, // Set your Gmail username as an environment variable (e.g., 'youremail@gmail.com')
        pass: process.env.GMAIL_PASS,  // Set your Gmail app password as an environment variable (e.g., 'your-app-password')
      },
    });
  }

  // Function to send a mail
  async sendMail(to: string, subject: string, htmlContent: string) {
    const mailOptions = {
      from: `"MoodyMap Support" <${process.env.GMAIL_USER}>`, // sender name and address
      to: to, // recipient
      subject: subject, // email subject
      html: htmlContent, // styled HTML content
    };
  
    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Message sent: %s', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Error sending email');
    }
  }
  
}
