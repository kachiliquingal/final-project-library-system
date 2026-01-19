import emailjs from "@emailjs/browser";

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const TEMPLATE_STUDENT = import.meta.env.VITE_EMAILJS_TEMPLATE_STUDENT;
const TEMPLATE_ADMIN = import.meta.env.VITE_EMAILJS_TEMPLATE_ADMIN;

/**
 * Sends email notifications using fixed templates.
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.subject
 * @param {string} params.message
 * @param {'student' | 'admin'} params.target
 */
export const sendEmailNotification = async ({
  name,
  subject,
  message,
  target = "student",
}) => {
  try {
    // Select the correct template based on the target
    const selectedTemplate =
      target === "admin" ? TEMPLATE_ADMIN : TEMPLATE_STUDENT;

    if (!SERVICE_ID || !selectedTemplate || !PUBLIC_KEY) {
      console.warn(
        "⚠️ Faltan claves de EmailJS. Revisa tu .env.local y reinicia el servidor.",
      );
      return;
    }

    const templateParams = {
      to_name: name,
      subject: subject,
      message: message,
      date: new Date().toLocaleString("es-EC", {
        timeZone: "America/Guayaquil",
      }),
    };

    //  Send the email
    await emailjs.send(
      SERVICE_ID,
      selectedTemplate,
      templateParams,
      PUBLIC_KEY,
    );
    console.log(`📧 Correo enviado correctamente (${target}).`);
  } catch (error) {
    console.error(`❌ Error enviando correo a ${target}:`, error);
  }
};
