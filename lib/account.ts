import { eq, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles, contributions, interests } from "@/db/schema";
import type { ChatGPTUser } from "@/app/chatgpt-auth";
import type { Account } from "./domain";
export async function readAccount(user: ChatGPTUser): Promise<Account> {
  const db = getDb();
  const [profileRows, entries, saved] = await Promise.all([db.select().from(profiles).where(eq(profiles.userId, user.userId)),db.select().from(contributions).where(eq(contributions.userId,user.userId)).orderBy(desc(contributions.year),desc(contributions.createdAt)),db.select().from(interests).where(eq(interests.userId,user.userId))]);
  const p = profileRows[0];
  return { profile: p ? {displayName:p.displayName,started:p.started,recognition:p.recognition,joinedAt:p.joinedAt} : {displayName: user.fullName ?? "New member",started:false,recognition:false,joinedAt:new Date().toISOString()}, contributions:entries.map(e=>({id:e.id,year:e.year,category:e.category,amountCents:e.amountCents,createdAt:e.createdAt})), interests:saved.map(x=>x.rewardId) };
}
