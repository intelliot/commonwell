import type { Account } from "./domain";
export function downloadFile(contents: string, name: string, type: string) { const url=URL.createObjectURL(new Blob([contents],{type})); const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000); }

function downloadDocument(kind:string,demo:boolean){const a=document.createElement("a");a.href=`/api/v1/download/${kind}${demo?"?sample=1":""}`;a.download="";document.body.appendChild(a);a.click();a.remove();}
export function downloadCard(_account:Account,demo:boolean){downloadDocument("card",demo);}
export function downloadCertificate(_account:Account,demo:boolean){downloadDocument("certificate",demo);}
export function downloadStatement(_account:Account,demo=false){downloadDocument("statement",demo);}
