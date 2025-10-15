import type { WebhookEvent } from '@clerk/backend';
import { createClerkClient } from '@clerk/backend';
import { db, eq, users } from '@myapp/db';
import { os } from '@orpc/server';
import { Webhook } from 'svix';
import { z } from 'zod';
import { env } from '@/env';

export const webhooks = {
  clerk: os
    .input(
      z.object({
        body: z.string(),
        headers: z.object({
          'svix-id': z.string(),
          'svix-timestamp': z.string(),
          'svix-signature': z.string(),
        }),
      }),
    )
    .handler(async ({ input }) => {
      const { body, headers } = input;

      // Verify webhook signature
      const webhookSecret = env.CLERK_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error('Missing CLERK_WEBHOOK_SECRET');
      }

      const wh = new Webhook(webhookSecret);
      let evt: WebhookEvent;

      try {
        evt = wh.verify(body, {
          'svix-id': headers['svix-id'],
          'svix-timestamp': headers['svix-timestamp'],
          'svix-signature': headers['svix-signature'],
        }) as WebhookEvent;
      } catch (_err) {
        throw new Error('Webhook verification failed');
      }

      // Handle the webhook event
      const eventType = evt.type;

      if (eventType === 'user.created') {
        const { id, email_addresses, first_name, last_name } = evt.data;
        const email = email_addresses[0]?.email_address;

        if (!email) {
          throw new Error('No email found');
        }

        // Insert user into database
        const [newUser] = await db
          .insert(users)
          .values({
            clerkUserId: id,
            email,
            firstName: first_name ?? '',
            lastName: last_name ?? '',
          })
          .returning({ id: users.id, email: users.email });

        // Set externalId to our custom user ID
        const clerkClient = createClerkClient({
          secretKey: env.CLERK_SECRET_KEY,
        });
        await clerkClient.users.updateUser(id, {
          externalId: newUser.id,
        });

        return { success: true, message: `User ${email} created` };
      }

      if (eventType === 'user.updated') {
        const { id, email_addresses, first_name, last_name } = evt.data;
        const email = email_addresses[0]?.email_address;

        if (!email) {
          throw new Error('No email found');
        }

        // Update user in database
        const [updatedUser] = await db
          .update(users)
          .set({
            email,
            ...(first_name ? { firstName: first_name } : {}),
            ...(last_name ? { lastName: last_name } : {}),
          })
          .where(eq(users.clerkUserId, id))
          .returning({ id: users.id, email: users.email });

        // Update externalId to keep it in sync
        if (updatedUser && updatedUser.id !== id) {
          const clerkClient = createClerkClient({
            secretKey: env.CLERK_SECRET_KEY,
          });
          await clerkClient.users.updateUser(id, {
            externalId: updatedUser.id,
          });
        }

        return { success: true, message: `User ${email} updated` };
      }

      if (eventType === 'user.deleted') {
        const { id } = evt.data;

        if (id) {
          await db.delete(users).where(eq(users.clerkUserId, id));
          return { success: true, message: `User ${id} deleted` };
        }

        throw new Error('No user ID found');
      }

      return { success: true, message: 'Event processed' };
    }),
};
