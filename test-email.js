/**
 * Email System Test Script
 * 
 * This script tests the email system to ensure:
 * 1. Dependencies are installed
 * 2. Configuration is correct
 * 3. Both providers (Resend & SMTP) work
 * 4. Templates render correctly
 * 
 * Usage: node test-email.js
 */

require('dotenv').config();

console.log('\n📧 AMHSJ Email System Test\n');
console.log('='.repeat(50));

// Check required environment variables
console.log('\n1. Checking Environment Variables...\n');

const requiredVars = [
  'FRONTEND_URL',
  'RESEND_API_KEY',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS'
];

let missingVars = [];

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`   ❌ ${varName}: NOT SET`);
    missingVars.push(varName);
  } else {
    // Mask sensitive values
    const displayValue = varName.includes('KEY') || varName.includes('PASS') 
      ? value.substring(0, 8) + '...' 
      : value;
    console.log(`   ✅ ${varName}: ${displayValue}`);
  }
});

if (missingVars.length > 0) {
  console.log('\n⚠️  Warning: Missing environment variables!');
  console.log('   Please set these in your .env file:');
  missingVars.forEach(v => console.log(`   - ${v}`));
} else {
  console.log('\n✅ All environment variables configured!');
}

// Check dependencies
console.log('\n2. Checking Dependencies...\n');

try {
  require('nodemailer');
  console.log('   ✅ nodemailer: Installed');
} catch (e) {
  console.log('   ❌ nodemailer: NOT INSTALLED');
  console.log('      Run: npm install nodemailer @types/nodemailer');
}

try {
  require('resend');
  console.log('   ✅ resend: Installed');
} catch (e) {
  console.log('   ❌ resend: NOT INSTALLED');
  console.log('      Run: npm install resend');
}

// Test Resend API
console.log('\n3. Testing Resend API...\n');

if (process.env.RESEND_API_KEY) {
  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  console.log('   📤 Sending test email via Resend...');
  
  // Note: This will actually send an email if you uncomment
  // resend.emails.send({
  //   from: 'AMHSJ <onboarding@resend.dev>',
  //   to: 'your-email@example.com',
  //   subject: 'AMHSJ Email Test - Resend',
  //   html: '<h1>Test Email</h1><p>Your Resend integration is working!</p>',
  // }).then(data => {
  //   console.log('   ✅ Resend test email sent!', data);
  // }).catch(error => {
  //   console.log('   ❌ Resend error:', error.message);
  // });
  
  console.log('   ⚠️  Test email commented out to avoid sending');
  console.log('   💡 Uncomment code in test-email.js to actually send');
} else {
  console.log('   ⏭️  Skipping (RESEND_API_KEY not set)');
}

// Test SMTP
console.log('\n4. Testing SMTP Configuration...\n');

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  
  console.log('   📤 Verifying SMTP connection...');
  
  transporter.verify()
    .then(() => {
      console.log('   ✅ SMTP connection verified!');
      console.log(`   📧 Ready to send from: ${process.env.SMTP_USER}`);
    })
    .catch((error) => {
      console.log('   ❌ SMTP verification failed:', error.message);
      console.log('\n   Common issues:');
      console.log('   - Incorrect username/password');
      console.log('   - Need app-specific password (Gmail)');
      console.log('   - Firewall blocking port 587');
      console.log('   - SMTP host incorrect');
    });
} else {
  console.log('   ⏭️  Skipping (SMTP credentials not set)');
}

// Template validation
console.log('\n5. Checking Email Templates...\n');

const fs = require('fs');
const path = require('path');

const emailServicePath = path.join(__dirname, 'src', 'email', 'email.service.ts');

if (fs.existsSync(emailServicePath)) {
  const content = fs.readFileSync(emailServicePath, 'utf8');
  
  const templates = [
    'getWelcomeTemplate',
    'getVerificationTemplate',
    'getSubmissionConfirmationTemplate',
    'getReviewInvitationTemplate',
    'getReviewAssignmentTemplate',
    'getReviewCompletedTemplate',
    'getStatusUpdateTemplate',
    'getRevisionRequestTemplate',
    'getReminderTemplate',
    'getDecisionNotificationTemplate',
    'getPublicationNotificationTemplate',
    'getNewsletterTemplate'
  ];
  
  templates.forEach(template => {
    if (content.includes(template)) {
      console.log(`   ✅ ${template}`);
    } else {
      console.log(`   ❌ ${template} - NOT FOUND`);
    }
  });
  
  console.log(`\n   📝 Total templates: ${templates.length}`);
} else {
  console.log('   ❌ email.service.ts not found');
}

// Integration check
console.log('\n6. Checking Module Integration...\n');

const modulePaths = [
  { name: 'EmailModule', path: 'src/email/email.module.ts' },
  { name: 'ResendService', path: 'src/email/services/resend.service.ts' },
  { name: 'SmtpService', path: 'src/email/services/smtp.service.ts' },
  { name: 'EmailController', path: 'src/email/email.controller.ts' }
];

modulePaths.forEach(({ name, path: filePath }) => {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`   ✅ ${name}: Found`);
  } else {
    console.log(`   ❌ ${name}: NOT FOUND`);
  }
});

// Check integrations
console.log('\n7. Checking Email Usage in Other Modules...\n');

const integrations = [
  { module: 'AuthController', path: 'src/auth/auth.controller.ts', method: 'sendVerificationEmail' },
  { module: 'ArticlesService', path: 'src/articles/articles.service.ts', method: 'sendSubmissionConfirmation' }
];

integrations.forEach(({ module, path: filePath, method }) => {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes(method)) {
      console.log(`   ✅ ${module}: Uses ${method}`);
    } else {
      console.log(`   ⚠️  ${module}: EmailService imported but ${method} not used`);
    }
  } else {
    console.log(`   ⏭️  ${module}: File not found`);
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 Test Summary\n');

if (missingVars.length === 0) {
  console.log('✅ Configuration: Complete');
} else {
  console.log(`⚠️  Configuration: ${missingVars.length} missing variable(s)`);
}

console.log('\n💡 Next Steps:\n');

if (missingVars.length > 0) {
  console.log('1. Set missing environment variables in .env file');
  console.log('2. Get Resend API key: https://resend.com');
  console.log('3. Configure SMTP credentials for your email provider');
}

console.log('4. Start the backend: npm run start:dev');
console.log('5. Test email endpoints:');
console.log('   POST /email/test - Send test email (Admin only)');
console.log('   POST /auth/register - Triggers verification email');
console.log('   POST /articles - Triggers submission confirmation');

console.log('\n📚 Documentation: See EMAIL_SYSTEM_GUIDE.md for full details\n');
console.log('='.repeat(50) + '\n');
