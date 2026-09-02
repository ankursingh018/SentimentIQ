const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

async function testEmail() {
    console.log('--- Email Configuration Test ---');
    console.log('User:', process.env.ALERT_EMAIL_USER);
    console.log('Pass:', process.env.ALERT_EMAIL_PASS ? '********' : 'MISSING');
    console.log('Recipient:', process.env.ALERT_RECIPIENT_EMAIL || process.env.ALERT_EMAIL_USER);
    console.log('--------------------------------');

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.ALERT_EMAIL_USER,
            pass: process.env.ALERT_EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.ALERT_EMAIL_USER,
        to: process.env.ALERT_RECIPIENT_EMAIL || process.env.ALERT_EMAIL_USER,
        subject: 'Nodemailer Test Connection',
        text: 'This is a test email to verify your Gmail App Password configuration.'
    };

    try {
        console.log('Attempting to send test email...');
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        console.log('Response:', info.response);
    } catch (error) {
        console.error('❌ Failed to send email.');
        console.error('Error details:', error.message);
        if (error.message.includes('535')) {
            console.error('\nPOSSIBLE CAUSES:');
            console.error('1. Your Gmail App Password is typed incorrectly.');
            console.error('2. You haven\'t enabled 2-Factor Authentication on your Gmail account.');
            console.error('3. You are using your NORMAL Gmail password instead of an "App Password".');
            console.error('\nHOW TO FIX:');
            console.error('Go to: https://myaccount.google.com/apppasswords');
            console.error('Create a new App Password named "Sentiment Dashboard" and copy the 16-character code into your .env file.');
        }
    }
}

testEmail();
