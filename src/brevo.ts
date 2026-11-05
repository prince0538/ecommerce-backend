import { TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo';

const emailApi = new TransactionalEmailsApi();
(emailApi as any).authentications.apiKey.apiKey = process.env.BREVO_API_KEY as string;

export const sendEmail = async (to: string, subject: string, html: string) => {
    const message = new SendSmtpEmail();
    message.subject = subject;
    message.htmlContent = html;
    message.sender = {
        name: process.env.BREVO_SENDER_NAME,
        email: process.env.BREVO_SENDER_EMAIL as string,
    };
    message.to = [{ email: to }];

    return emailApi.sendTransacEmail(message);
};