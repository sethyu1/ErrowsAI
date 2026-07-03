import mailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

const EMAIL_TEMPLATE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verification Code</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4">
    <table
      border="0"
      cellpadding="0"
      cellspacing="0"
      width="100%"
      style="
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        padding: 20px;
        border-radius: 8px;
        margin-top: 20px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      "
    >
      <tr>
        <td style="padding: 20px; color: #666666; line-height: 1.6">
          <p>Your verification code is:</p>
          <div style="background-color: #f8f8f8; padding: 15px; border-radius: 4px; text-align: center; margin: 20px 0">
            <span style="font-size: 32px; font-weight: bold; color: #333333; letter-spacing: 5px">{{VERIFICATION_CODE}}</span>
          </div>
          <p>Please do not share this code with anyone.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <p>This is an automated message, please do not reply.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

function createTransporter(options: SMTPTransport.Options): mailer.Transporter {
  return mailer.createTransport(options);
}

/**
 * 生成邮件内容和主题
 * @param type 邮件类型：'code' | 'link'
 * @param value 验证码或链接
 * @returns 邮件主题和占位符替换对象
 */
function generateEmailContent(type: 'code' | 'link', value: string): { subject: string; replacements: Record<string, string> } {
  if (type === 'code') {
    return {
      subject: 'Verification Code',
      replacements: {
        VERIFICATION_CODE: value
      }
    };
  } else {
    return {
      subject: 'Email Verification',
      replacements: {
        VERIFICATION_CODE: value
      }
    };
  }
}

/**
 * 处理HTML邮件模板，替换占位符
 * @param replacements 占位符替换对象
 * @returns 处理后的HTML内容
 */
function processHtmlTemplate(replacements: Record<string, string>): string {
  let html = EMAIL_TEMPLATE;
  

  for (const [placeholder, value] of Object.entries(replacements)) {
    const regex = new RegExp(`{{${placeholder}}}`, 'g');
    const beforeCount = (html.match(regex) || []).length;
    html = html.replace(regex, value);
  }


  const remainingPlaceholders = html.match(/\{\{[A-Z_]+\}\}/g);

  return html;
}

interface SendMailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}
async function sendMail(
  transporter: mailer.Transporter,
  mailOption: SendMailOptions
): Promise<void> {
  await transporter.sendMail(mailOption);
}

export async function sendEmailVerification(
  transportOptions: SMTPTransport.Options,
  receiverOptions: { from: string, to: string },
  verifyLink: string
): Promise<void> {
  const transporter = createTransporter(transportOptions);

  const { from, to } = receiverOptions;

  const emailContent = generateEmailContent('link', verifyLink);

  const htmlContent = processHtmlTemplate(emailContent.replacements);

  const mailOption: SendMailOptions = {
    from, to,
    subject: emailContent.subject,
    html: htmlContent,
  };

  await sendMail(transporter, mailOption);
}

export async function sendEmailVerificationCode(
  transportOptions: SMTPTransport.Options,
  receiverOptions: { from: string, to: string },
  verificationCode: string
): Promise<void> {
  const transporter = createTransporter(transportOptions);

  const { from, to } = receiverOptions;

  const emailContent = generateEmailContent('code', verificationCode);

  const htmlContent = processHtmlTemplate(emailContent.replacements);

  const mailOption: SendMailOptions = {
    from, to,
    subject: emailContent.subject,
    html: htmlContent,
  };

  await sendMail(transporter, mailOption);
}
