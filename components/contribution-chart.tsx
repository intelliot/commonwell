import { money, yearTotals, type Contribution } from "@/lib/domain";
export function ContributionChart({entries}:{entries:Contribution[]}) {
  const years=yearTotals(entries).slice(-6), max=Math.max(...years.map(y=>y[1]),1);
  if(!years.length) return <div className="chart-empty"><div className="empty-bars" aria-hidden="true"><i/><i/><i/><i/><i/></div><p>Your story starts with your first contribution.</p></div>;
  return <div className="chart" role="img" aria-label={years.map(([year,sum])=>`${year}: ${money(sum,true)}`).join("; ")}><div className="chart-y"><span>{money(max)}</span><span>{money(max/2)}</span><span>$0</span></div><div className="chart-bars">{years.map(([year,sum],i)=><div className="chart-column" key={year}><span className="bar-value">{money(sum)}</span><div className={`chart-bar ${i===years.length-1?"latest":""}`} style={{height:`${Math.max(sum/max*132,4)}px`}}><span className="bar-top"/></div><span className="bar-year">{year}</span></div>)}</div></div>;
}
