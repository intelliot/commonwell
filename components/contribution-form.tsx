"use client";
import { useState } from "react";
import { LockKeyhole, ArrowRight } from "lucide-react";
import { CATEGORIES, amountToCents, type Contribution } from "@/lib/domain";
export function ContributionForm({entry,onSave,busy,error}:{entry?:Contribution;onSave:(entry:{year:number;category:string;amountCents:number})=>Promise<void>;busy:boolean;error:string}) {
  const [formError,setFormError]=useState("");
  return <form onSubmit={async e=>{e.preventDefault();setFormError(""); const data=new FormData(e.currentTarget);try{await onSave({year:Number(data.get("year")),category:String(data.get("category")),amountCents:amountToCents(String(data.get("amount")))});}catch(err){setFormError((err as Error).message);}}}>
    <p className="modal-description">Record a yearly total from your own records. Only the year, category, and amount are saved.</p>
    <div className="form-grid"><label>Tax year<input name="year" type="number" min="1900" max={new Date().getUTCFullYear()} defaultValue={entry?.year??new Date().getUTCFullYear()-1} required/></label><label>Category<select name="category" defaultValue={entry?.category??CATEGORIES[0]}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></label></div>
    <label>Amount in USD<div className="amount-input"><span>$</span><input name="amount" inputMode="decimal" placeholder="0.00" defaultValue={entry? (entry.amountCents/100).toFixed(2):""} required autoFocus/></div></label>
    <p className="field-help">Use one total per year and category. Avoid counting the same tax twice—for example, both withholding and the final annual total.</p>
    <div className="notice"><LockKeyhole size={18}/><span>No tax documents, Social Security numbers, or bank details needed. Contributions are self-reported.</span></div>
    {(formError||error)&&<p className="form-error" role="alert">{formError||error}</p>}
    <button className="button primary full" disabled={busy}>{busy?"Saving…":entry?"Save changes":"Save contribution"}<ArrowRight size={17}/></button>
  </form>;
}
