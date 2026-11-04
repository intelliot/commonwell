export const BRAND = { name: "Commonwell", tagline: "Your contribution, recognized." };
export const CATEGORIES = ["Federal income", "State & local income", "Property", "Payroll", "Other"] as const;
export type Category = typeof CATEGORIES[number];
export interface Contribution { id: string; year: number; category: string; amountCents: number; createdAt: string }
export interface Profile { displayName: string; started: boolean; recognition: boolean; joinedAt: string }
export interface Account { profile: Profile; contributions: Contribution[]; interests: string[] }
export const TIERS = [
  { name: "Member", threshold: 0, color: "#728174", description: "Every contribution is a beginning." },
  { name: "Bronze", threshold: 25000, color: "#9d714e", description: "Building something that lasts." },
  { name: "Silver", threshold: 100000, color: "#7b8b85", description: "A meaningful mark on the common good." },
  { name: "Gold", threshold: 500000, color: "#b59650", description: "An extraordinary commitment." },
  { name: "Platinum", threshold: 5000000, color: "#64798b", description: "A lifetime of remarkable contribution." },
] as const;
export function totalCents(entries: Contribution[]) { return entries.reduce((sum, e) => sum + e.amountCents, 0); }
export function tierFor(cents: number) { return [...TIERS].reverse().find(t => cents >= t.threshold * 100) ?? TIERS[0]; }
export function nextTier(cents: number) { return TIERS.find(t => t.threshold * 100 > cents); }
export function money(cents: number, decimals = false) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: decimals ? 2 : 0, minimumFractionDigits: decimals ? 2 : 0 }).format(cents / 100); }
export function yearTotals(entries: Contribution[]) { const totals = new Map<number, number>(); for (const e of entries) totals.set(e.year, (totals.get(e.year) ?? 0) + e.amountCents); return [...totals].sort((a,b) => a[0]-b[0]); }
export function amountToCents(value: string) { if (!/^\d{1,10}(\.\d{1,2})?$/.test(value.trim())) throw new Error("Enter a positive amount with no more than two decimal places."); const [whole, fraction = ""] = value.trim().split("."); const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0")); if (cents <= 0 || cents > 100_000_000_000) throw new Error("Enter an amount between $0.01 and $1 billion."); return cents; }
export function validateEntry(input: unknown): Pick<Contribution, "year" | "category" | "amountCents"> {
  if (!input || typeof input !== "object") throw new Error("Contribution details are required.");
  const e = input as Record<string, unknown>;
  if (!Number.isInteger(e.year) || Number(e.year) < 1900 || Number(e.year) > new Date().getUTCFullYear()) throw new Error("Choose a tax year between 1900 and the current year.");
  if (!CATEGORIES.includes(e.category as Category)) throw new Error("Choose a supported tax category.");
  if (!Number.isSafeInteger(e.amountCents) || Number(e.amountCents) <= 0 || Number(e.amountCents) > 100_000_000_000) throw new Error("Enter a positive amount up to $1 billion.");
  return { year: Number(e.year), category: String(e.category), amountCents: Number(e.amountCents) };
}
export function parseCsv(text: string) {
  const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  if (lines.shift()?.toLowerCase().trim() !== "year,category,amount") throw new Error("Use the template headers: year,category,amount");
  if (!lines.length || lines.length > 100) throw new Error("Import between 1 and 100 rows at a time.");
  const seen = new Set<string>();
  return lines.map((line, index) => {
    const parts = line.split(",").map(p => p.trim().replace(/^"|"$/g, ""));
    if (parts.length !== 3) throw new Error(`Row ${index + 2}: expected year, category, and amount.`);
    try { const entry = validateEntry({ year: Number(parts[0]), category: parts[1], amountCents: amountToCents(parts[2]) }); const key = `${entry.year}:${entry.category}`; if(seen.has(key)) throw new Error("Duplicate year and category."); seen.add(key); return entry; } catch (error) { throw new Error(`Row ${index + 2}: ${(error as Error).message}`); }
  });
}
export function contributionsCsv(entries: Contribution[]) { return "year,category,amount\n" + entries.map(e => `${e.year},${e.category},${(e.amountCents / 100).toFixed(2)}`).join("\n"); }
export const DEMO_ACCOUNT: Account = {
  profile: { displayName: "Alex Morgan", started: true, recognition: false, joinedAt: "2026-11-01T12:00:00.000Z" },
  contributions: [[2023,"Federal income",13400],[2024,"Federal income",35400],[2024,"State & local income",12600],[2024,"Property",7200],[2025,"Federal income",38250],[2025,"State & local income",14200],[2025,"Property",7400]].map(([year,category,amount],i)=>({ id:`sample-${i}`,year:Number(year),category:String(category),amountCents:Number(amount)*100,createdAt:"2026-11-01T12:00:00.000Z" })),
  interests: [],
};
export interface Reward { id: string; title: string; description: string; category: "Recognition" | "Travel" | "Culture" | "Everyday"; status: "available" | "planned"; kind: "card" | "certificate" | "statement" | "partner"; image?: string; label: string }
export const REWARDS: Reward[] = [
  {id:"member-card",title:"A card that means something.",description:"Your personal digital membership card, with your contribution tier. Download it and keep your progress close.",category:"Recognition",status:"available",kind:"card",label:"Yours to keep"},
  {id:"certificate",title:"Your contribution, on record.",description:"A personalized contribution certificate you can download or print. A private honor from Commonwell, based on your self-reported records.",category:"Recognition",status:"available",kind:"certificate",label:"Made for you"},
  {id:"statement",title:"Your year. All together.",description:"Export your contribution history as a reusable CSV. Your records stay yours, wherever you go next.",category:"Recognition",status:"available",kind:"statement",label:"Always available"},
  {id:"lounge",title:"A little room to unwind.",description:"Airport lounge visits funded by a future travel partner. Save this idea to tell us what matters to you. No lounge access is currently included.",category:"Travel",status:"planned",kind:"partner",image:"/illustrations/lounge.svg",label:"Lounge experiences"},
  {id:"museum",title:"Make time for a little wonder.",description:"Museum admission and cultural experiences from future partners. No museum partnership or admission benefit is currently available.",category:"Culture",status:"planned",kind:"partner",image:"/illustrations/museum.svg",label:"Arts & culture"},
  {id:"parks",title:"More of the great outdoors.",description:"Sponsor-funded park passes could cover standard admission. This is a proposed benefit, with no special access or government affiliation.",category:"Travel",status:"planned",kind:"partner",image:"/illustrations/parks.svg",label:"Parks & open spaces"},
  {id:"local",title:"Good things, closer to home.",description:"Member offers from neighborhood businesses. We are collecting interest before bringing participating businesses on board.",category:"Everyday",status:"planned",kind:"partner",image:"/illustrations/local.svg",label:"Neighborhood favorites"},
];
