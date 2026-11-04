import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title:"Commonwell — Your contribution, recognized.",description:"A little recognition for your part in the bigger picture. Track your tax contributions, celebrate milestones, and shape a new kind of membership.",manifest:"/manifest.webmanifest",appleWebApp:{capable:true,statusBarStyle:"default",title:"Commonwell"},icons:{icon:"/favicon.svg",apple:"/apple-touch-icon.png"} };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
