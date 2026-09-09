import { Resend } from "resend";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1),
  email: z.email(),
  message: z.string().trim().min(1),
});

function unavailable(): Response {
  return Response.json({ error: "Unable to send message." }, { status: 503 });
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return unavailable();
  }

  const to = process.env.CONTACT_TO_EMAIL;
  if (!to) {
    return unavailable();
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const { name, email, message } = parsed.data;
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: "__F7T_APP_NAME__ <onboarding@resend.dev>",
    to,
    replyTo: email,
    subject: `Contact from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
  });

  if (error) {
    return Response.json({ error: "Unable to send message." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
