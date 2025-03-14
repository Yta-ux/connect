import { eq } from 'drizzle-orm'
import { db } from '../drizzle/client'
import { subscriptions } from '../drizzle/schema/subscriptions'
import { redis } from '../redis/client'

interface SubscribeToEventParams {
  name: string
  email: string
  referrerId?: string | null
}
export async function subscribeToEvent({
  name,
  email,
  referrerId,
}: SubscribeToEventParams) {
  const existeUserEmail = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.email, email))

  if (existeUserEmail.length > 0) {
    return {
      subscriberId: existeUserEmail[0].id,
    }
  }
  const result = await db
    .insert(subscriptions)
    .values({
      name,
      email,
    })
    .returning()

  if (referrerId) {
    await redis.zincrby('referral:ranking', 1, referrerId)
  }
  const subscriber = result[0]

  return {
    subscriberId: subscriber.id,
  }
}
