import { getChatGPTUser } from "./chatgpt-auth";
import { readAccount } from "@/lib/account";
import { MembershipApp } from "@/components/membership-app";
export const dynamic = "force-dynamic";
export default async function Home() { const user=await getChatGPTUser(); const account=user ? await readAccount(user) : null; return <MembershipApp initialAccount={account} signedIn={!!user} />; }
