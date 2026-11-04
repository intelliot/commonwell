import { ArrowUpRight, Sparkles } from "lucide-react";
import { BRAND, type Account, tierFor, totalCents } from "@/lib/domain";
export function MemberCard({account,onClick}:{account:Account;onClick?:()=>void}) {
  const tier=tierFor(totalCents(account.contributions));
  return <button className="member-card" onClick={onClick} aria-label="View and download membership card"><span className="card-top"><span className="card-brand">{BRAND.name}<span className="brand-dot">✳</span></span><ArrowUpRight size={21}/></span><span className="card-main"><span className="card-caption">YOUR CONTRIBUTION. RECOGNIZED.</span><span className="card-tier">{tier.name}<Sparkles strokeWidth={1} size={44}/></span><span className="card-caption">MEMBERSHIP</span></span><span className="card-bottom"><span>{account.profile.displayName}</span><span className="card-caption">FOUNDING MEMBER</span></span><span className="card-rings" aria-hidden="true"/></button>;
}
