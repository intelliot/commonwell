import { and, eq, sql } from "drizzle-orm";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { profiles, contributions, interests, suggestions } from "@/db/schema";
import { readAccount } from "@/lib/account";
import { DEMO_ACCOUNT, contributionsCsv, REWARDS, tierFor, validateEntry } from "@/lib/domain";
import { cardSvg, certificateSvg } from "@/lib/documents";
import { readJsonBody, RequestError } from "@/lib/request-security";
export const dynamic = "force-dynamic";
const response = (data: unknown, status = 200) => Response.json(data, {status, headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
async function handle(req: Request) {
  const user = await getChatGPTUser();
  const path = new URL(req.url).pathname.replace(/^\/api\/v1\//, "");
  const isSampleDownload=req.method==="GET"&&/^download\/(card|certificate|statement)$/.test(path)&&new URL(req.url).searchParams.get("sample")==="1";
  if(!user&&!isSampleDownload) return response({error:"Sign in to access your membership."},401);
  try {
    if(req.method==="GET" && /^download\/(card|certificate|statement)$/.test(path)) {
      const sample=isSampleDownload,account=sample?DEMO_ACCOUNT:await readAccount(user!);
      const kind=path.split("/")[1],isCsv=kind==="statement";
      const contents=kind==="card"?cardSvg(account,sample):kind==="certificate"?certificateSvg(account,sample):contributionsCsv(account.contributions);
      return new Response(contents,{headers:{"Content-Type":isCsv?"text/csv;charset=utf-8":"image/svg+xml;charset=utf-8","Content-Disposition":`attachment; filename="commonwell-${sample?"sample-":""}${kind}.${isCsv?"csv":"svg"}"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; style-src 'unsafe-inline'; sandbox"}});
    }
    if(!user) return response({error:"Sign in to access your membership."},401);
    const db = getDb();
    if (req.method === "GET") {
      if (path === "account") return response(await readAccount(user));
      if (path === "community") {
        const rows = await db.select({displayName:profiles.displayName,joinedAt:profiles.joinedAt,total:sql<number>`coalesce(sum(${contributions.amountCents}),0)`}).from(profiles).leftJoin(contributions,eq(profiles.userId,contributions.userId)).where(eq(profiles.recognition,true)).groupBy(profiles.userId).limit(100);
        return response(rows.map(r=>({displayName:r.displayName,joinedAt:r.joinedAt,tier:tierFor(r.total).name})));
      }
      return response({error:"Not found."},404);
    }
    const origin=req.headers.get("origin");
    if (!origin || origin !== new URL(req.url).origin) return response({error:"Request origin is not allowed."},403);
    if (req.method !== "DELETE" && !req.headers.get("content-type")?.includes("application/json")) return response({error:"Send JSON data."},415);
    const body = req.method === "DELETE" ? {} : await readJsonBody(req);
    if (path === "profile" && req.method === "PUT") {
      if(typeof body.displayName!=="string" || !body.displayName.trim() || body.displayName.trim().length>60 || /[\u0000-\u001F]/.test(body.displayName)) return response({error:"Enter a display name between 1 and 60 characters."},400);
      if(typeof body.recognition!=="boolean") return response({error:"Choose your recognition preference."},400);
      const update={displayName:body.displayName.trim(),recognition:body.recognition,started:true};
      await db.insert(profiles).values({userId:user.userId,...update,joinedAt:new Date().toISOString()}).onConflictDoUpdate({target:profiles.userId,set:update});
    } else if (path === "contributions" && req.method === "POST") {
      const entry=validateEntry(body);
      await db.insert(contributions).values({...entry,id:crypto.randomUUID(),userId:user.userId,createdAt:new Date().toISOString()});
    } else if (path === "contributions/import" && req.method === "POST") {
      if (!Array.isArray(body.entries) || body.entries.length < 1 || body.entries.length > 100) return response({error:"Import between 1 and 100 entries."},400);
      const entries = body.entries.map(validateEntry);
      if(new Set(entries.map(e=>`${e.year}:${e.category}`)).size!==entries.length) return response({error:"The import contains duplicate years and categories."},409);
      const queries=entries.map(e=>db.insert(contributions).values({...e,id:crypto.randomUUID(),userId:user.userId,createdAt:new Date().toISOString()}));
      await db.batch([queries[0],...queries.slice(1)]);
    } else if (/^contributions\/[^/]+$/.test(path) && (req.method === "DELETE" || req.method === "PUT")) {
      const condition=and(eq(contributions.id,path.split("/")[1]),eq(contributions.userId,user.userId));
      const existing=await db.select({id:contributions.id}).from(contributions).where(condition);
      if(!existing.length) return response({error:"Contribution not found."},404);
      if(req.method === "DELETE") await db.delete(contributions).where(condition);
      else await db.update(contributions).set(validateEntry(body)).where(condition);
    } else if (path === "interests" && req.method === "PUT") {
      if(typeof body.rewardId!=="string" || !REWARDS.some(r=>r.id===body.rewardId&&r.status==="planned") || typeof body.saved!=="boolean") return response({error:"Choose a valid proposed perk."},400);
      if(body.saved) await db.insert(interests).values({userId:user.userId,rewardId:body.rewardId}).onConflictDoNothing();
      else await db.delete(interests).where(and(eq(interests.userId,user.userId),eq(interests.rewardId,body.rewardId)));
    } else if(path === "suggestions" && req.method === "POST") {
      if(typeof body.message!=="string" || body.message.trim().length<10 || body.message.length>1000) return response({error:"Describe your idea in 10–1,000 characters."},400);
      await db.insert(suggestions).values({id:crypto.randomUUID(),userId:user.userId,message:body.message.trim(),createdAt:new Date().toISOString()});
      return response({ok:true});
    } else return response({error:"Not found."},404);
    return response(await readAccount(user));
  } catch(error) {
    if (error instanceof RequestError) return response({error:error.message},error.status);
    const message=error instanceof Error ? error.message : "";
    const cause=error instanceof Error&&error.cause instanceof Error?error.cause.message:"";
    if(/UNIQUE|unique constraint/i.test(message+cause)) return response({error:"You already have a record for that year and category. Edit the existing record instead. No new entries were saved."},409);
    if(/Choose|Enter|Contribution details/.test(message)) return response({error:message},400);
    console.error("Membership request failed", {path,method:req.method});
    return response({error:"We couldn’t save that change. Please try again."},500);
  }
}
export const GET=handle; export const POST=handle; export const PUT=handle; export const DELETE=handle;
