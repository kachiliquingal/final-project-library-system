import emailjs from "@emailjs/browser";

// LEEMOS LAS CLAVES DESDE EL ARCHIVO .ENV.LOCAL
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const TEMPLATE_STUDENT = import.meta.env.VITE_EMAILJS_TEMPLATE_STUDENT;
const TEMPLATE_ADMIN = import.meta.env.VITE_EMAILJS_TEMPLATE_ADMIN;

/**
 * Envía notificaciones por correo usando plantillas fijas.
 * @param {Object} params
 * @param {string} params.name - Nombre de la persona
 * @param {string} params.subject - Asunto
 * @param {string} params.message - Mensaje
 * @param {'student' | 'admin'} params.target - Define qué plantilla usar
 */
export const sendEmailNotification = async ({
  name,
  subject,
  message,
  target = "student",
}) => {
  try {
    // 1. Seleccionamos la plantilla correcta según el objetivo
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

    // 2. Enviamos el correo (El destinatario ya está fijo en la plantilla de la web)
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
