import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Email } from "@convex-dev/auth/providers/Email";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password({
      reset: Email({
        async sendVerificationRequest({ identifier: email, token }) {
          await resend.emails.send({
            from: "orthdx.site <no-reply@orthdx.site>",
            to: email,
            subject: "Reset your password",
            text: `Your password reset code is: ${token}\n\nThis code expires in 1 hour.`,
          });
        },
      }),
    }),
  ],
});
