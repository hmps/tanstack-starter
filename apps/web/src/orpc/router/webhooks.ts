import type { WebhookEvent } from '@clerk/backend';
import { createClerkClient } from '@clerk/backend';
import { db, eq, users } from '@myapp/db';
import { os } from '@orpc/server';
import { Webhook } from 'svix';
import { z } from 'zod';
import { env } from '@/env';
import { logger } from '@/lib/logger/logger.server';

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
        logger.error({ body, headers }, 'Missing CLERK_WEBHOOK_SECRET');
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
        logger.error(
          { error: _err instanceof Error ? _err.message : String(_err) },
          'Webhook verification failed',
        );
        throw new Error('Webhook verification failed');
      }

      // Handle the webhook event
      const eventType = evt.type;

      if (eventType === 'user.created') {
        const { id, email_addresses, first_name, last_name } = evt.data;
        const email = email_addresses[0]?.email_address;

        if (!email) {
          logger.error({ eventType, userId: id }, 'No email found');
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

        logger.info(
          { userId: newUser.id, email: newUser.email, clerkUserId: id },
          'Created user with externalId',
        );

        return { success: true, message: `User ${email} created` };
      }

      if (eventType === 'user.updated') {
        const { id, email_addresses, first_name, last_name } = evt.data;
        const email = email_addresses[0]?.email_address;

        if (!email) {
          logger.error(
            { eventType, userId: id },
            'No email found to update user',
          );
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

        logger.info(
          { userId: updatedUser.id, email: updatedUser.email, clerkUserId: id },
          'Updated externalId for user',
        );

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
          logger.info({ clerkUserId: id }, 'Deleted user');

          return { success: true, message: `User ${id} deleted` };
        }

        logger.error({ eventType }, 'No user ID found to delete');
        throw new Error('No user ID found');
      }

      logger.info({ eventType }, 'Event processed');
      return { success: true, message: 'Event processed' };
    }),
};
