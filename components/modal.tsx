"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
export function Modal({title,onClose,children,wide=false}:{title:string;onClose:()=>void;children:React.ReactNode;wide?:boolean}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{ const dialog=ref.current!; dialog.showModal(); const old=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{dialog.close();document.body.style.overflow=old;};},[]);
  return <dialog ref={ref} className={`modal ${wide?"wide":""}`} aria-labelledby="modal-title" onCancel={onClose} onClick={e=>{if(e.target===ref.current)onClose();}}><div className="modal-inner"><div className="modal-top"><h2 id="modal-title">{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={20}/></button></div>{children}</div></dialog>;
}
