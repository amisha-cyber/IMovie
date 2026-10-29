import '../config/environment.js';
import { emailService } from '../services/emailService.js';
import { env } from '../config/environment.js';

async function main() {
  console.log('Sending test verification email to:', env.SMTP_USER);
  const result = await emailService.sendVerificationEmail({
    to: env.SMTP_USER,
    name: 'Nayan',
    token: 'test_token_1234567890abcdef',
    otp: '123456'
  });
  console.log('RESULT:', JSON.stringify(result));
}

main().catch(err => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
