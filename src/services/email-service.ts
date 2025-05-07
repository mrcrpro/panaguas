
'use server';

import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

// Define interface for user data needed for emails
interface UserEmailData {
  email: string;
  name?: string;
}

// Configure the transporter using environment variables
const smtpConfig: SMTPTransport.Options = {
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587', 10), // Default to 587 if not set
  secure: process.env.EMAIL_SECURE === 'true', // Use true for port 465, false for others
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};

let transporter: Mail | null = null;
let isTransporterVerified = false;

// Function to initialize and verify the transporter
const initializeTransporter = async () => {
  if (transporter && isTransporterVerified) {
    return transporter;
  }

  // Basic validation of environment variables
  if (!smtpConfig.host || !smtpConfig.auth.user || !smtpConfig.auth.pass) {
    console.error('Email Service Error: Missing required environment variables (EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS)');
    // Decide if you want to throw an error or just prevent sending emails
    // For now, we'll log and prevent sending.
    return null;
  }

  transporter = nodemailer.createTransport(smtpConfig);

  try {
    console.log('Verifying email transporter configuration...');
    await transporter.verify();
    isTransporterVerified = true;
    console.log('Email transporter configured and verified successfully.');
    return transporter;
  } catch (error) {
    console.error('Email Service Error: Failed to verify transporter configuration:', error);
    transporter = null; // Reset transporter if verification fails
    isTransporterVerified = false;
    return null;
  }
};

// Generic function to send an email
const sendEmail = async (mailOptions: Mail.Options) => {
  const currentTransporter = await initializeTransporter();
  if (!currentTransporter) {
    console.error('Email not sent: Transporter is not available or configured correctly.');
    return; // Prevent sending if transporter is not ready
  }

  const fromAddress = process.env.EMAIL_FROM || smtpConfig.auth.user;
  if (!fromAddress) {
       console.error('Email not sent: EMAIL_FROM or EMAIL_USER environment variable is missing.');
       return;
   }


  const optionsWithFrom = {
    ...mailOptions,
    from: `PanAguas Uniandes <${fromAddress}>`, // Use a descriptive sender name
  };

  try {
    const info = await currentTransporter.sendMail(optionsWithFrom);
    console.log(`Email sent successfully to ${mailOptions.to}: ${info.messageId}`);
  } catch (error) {
    console.error(`Error sending email to ${mailOptions.to}:`, error);
    // Optionally, implement retry logic or error reporting here
  }
};

// --- Specific Email Functions ---

/**
 * Sends a welcome email upon registration.
 */
export const sendWelcomeEmail = async (user: UserEmailData) => {
   if (!user.email) return;
   await sendEmail({
     to: user.email,
     subject: '¡Bienvenido/a a PanAguas Uniandes!',
     text: `Hola ${user.name || 'Usuario'},\n\nGracias por registrarte en PanAguas. Ya puedes empezar a disfrutar del servicio de préstamo de paraguas en el campus.\n\nRecuerda consultar las estaciones y tu estado en nuestro portal.\n\n¡Hasta la lluvia es compartida!\nEquipo PanAguas`,
     // TODO: Add HTML version later
   });
 };


/**
 * Sends a loan confirmation email.
 */
export const sendLoanConfirmationEmail = async (user: UserEmailData, stationName: string, loanId: string, allowedDurationMinutes: number) => {
  if (!user.email) return;
  await sendEmail({
    to: user.email,
    subject: 'Confirmación de Préstamo PanAguas',
    text: `Hola ${user.name || 'Usuario'},\n\nHas solicitado un paraguas de PanAguas en la estación ${stationName}.\n\nID del Préstamo: ${loanId}\nTienes ${allowedDurationMinutes} minutos para usarlo.\n\nPor favor, devuelve el paraguas a tiempo para evitar multas.\n\n¡Gracias por usar PanAguas!`,
    // TODO: Add HTML version later
  });
};

/**
 * Sends a return confirmation email. Includes fine info if applicable.
 */
export const sendReturnConfirmationEmail = async (user: UserEmailData, stationName: string, loanId: string, fineAmount?: number) => {
  if (!user.email) return;
  let text = `Hola ${user.name || 'Usuario'},\n\nHas devuelto tu paraguas PanAguas (Préstamo ID: ${loanId}) en la estación ${stationName}.\n\n`;
  if (fineAmount && fineAmount > 0) {
    // Updated wording for fine
    text += `IMPORTANTE: Se ha aplicado una multa de $${fineAmount.toLocaleString()} COP por devolución tardía. Puedes consultar el detalle y pagar la multa desde tu cuenta en el portal PanAguas.\n\n`;
  } else {
    text += `¡Gracias por devolverlo a tiempo!\n\n`;
  }
  text += `Equipo PanAguas`;

  await sendEmail({
    to: user.email,
    subject: fineAmount && fineAmount > 0 ? 'Devolución PanAguas y Notificación de Multa' : 'Confirmación de Devolución PanAguas', // Dynamic subject
    text: text,
    // TODO: Add HTML version later
  });
};

/**
 * Sends a 15-minute warning email before the loan is overdue.
 * IMPORTANT: This function needs to be triggered externally (e.g., via Firebase Cloud Function + Cloud Scheduler).
 */
export const sendOverdueWarningEmail15min = async (user: UserEmailData, loanId: string) => {
  console.warn('sendOverdueWarningEmail15min needs external triggering (e.g., Cloud Function).');
  if (!user.email) return;
  await sendEmail({
    to: user.email,
    subject: '¡Alerta PanAguas! Tu préstamo vence pronto (15 min)',
    text: `Hola ${user.name || 'Usuario'},\n\nRecordatorio amistoso: A tu préstamo de PanAguas (ID: ${loanId}) le quedan aproximadamente 15 minutos de tiempo gratuito.\n\nPor favor, dirígete a una estación para devolverlo pronto y evitar multas.\n\nEquipo PanAguas`,
    // TODO: Add HTML version later
  });
};

/**
 * Sends a 5-minute warning email before the loan is overdue.
 * IMPORTANT: This function needs to be triggered externally (e.g., via Firebase Cloud Function + Cloud Scheduler).
 */
export const sendOverdueWarningEmail5min = async (user: UserEmailData, loanId: string) => {
  console.warn('sendOverdueWarningEmail5min needs external triggering (e.g., Cloud Function).');
  if (!user.email) return;
  await sendEmail({
    to: user.email,
    subject: '¡Última Alerta PanAguas! Tu préstamo vence en 5 minutos',
    text: `Hola ${user.name || 'Usuario'},\n\n¡Atención! A tu préstamo de PanAguas (ID: ${loanId}) le quedan solo 5 minutos de tiempo gratuito.\n\nDevuélvelo inmediatamente en cualquier estación para evitar que se genere una multa.\n\nEquipo PanAguas`,
    // TODO: Add HTML version later
  });
};


/**
 * Sends a notification when a fine starts accumulating (optional, could be part of return email).
 * If used, this likely needs external triggering as well.
 */
export const sendFineStartedEmail = async (user: UserEmailData, loanId: string) => {
    console.warn('sendFineStartedEmail needs external triggering or integration into return logic.');
   if (!user.email) return;
   await sendEmail({
     to: user.email,
     subject: 'Notificación de Multa PanAguas Iniciada',
     text: `Hola ${user.name || 'Usuario'},\n\nTu préstamo PanAguas (ID: ${loanId}) ha excedido el tiempo gratuito. Se ha comenzado a aplicar una multa por retraso.\n\nPor favor, devuelve el paraguas lo antes posible para minimizar el costo. Puedes ver el monto acumulado en tu cuenta.\n\nEquipo PanAguas`,
     // TODO: Add HTML version later
   });
 };


// --- Placeholder functions for future implementation ---

export const sendOverdueReminderEmail = async (user: UserEmailData, loanId: string, overdueTime: string) => {
  // Requires a scheduled function to implement
  console.warn('sendOverdueReminderEmail not fully implemented yet.');
  // if (!user.email) return;
  // await sendEmail({
  //   to: user.email,
  //   subject: 'Recordatorio: Devolución de Paraguas PanAguas Pendiente',
  //   text: `Hola ${user.name || 'Usuario'},\n\nTe recordamos que tu préstamo PanAguas (ID: ${loanId}) está vencido desde hace ${overdueTime}.\n\nPor favor, devuelve el paraguas lo antes posible para evitar multas adicionales.\n\nEquipo PanAguas`,
  // });
};

export const sendDonationConfirmationEmail = async (user: UserEmailData, amount: number, tier: string) => {
   // Trigger this after successful donation processing
   console.warn('sendDonationConfirmationEmail not fully implemented yet.');
   // if (!user.email) return;
   // await sendEmail({
   //   to: user.email,
   //   subject: '¡Gracias por tu Donación a PanAguas!',
   //   text: `Hola ${user.name || 'Usuario'},\n\nHemos recibido tu generosa donación de $${amount.toLocaleString()} COP. ¡Tu apoyo es fundamental para mantener y mejorar PanAguas!\n\nHas alcanzado el nivel de donador: ${tier}.\n\nGracias de nuevo,\nEquipo PanAguas`,
   // });
 };
