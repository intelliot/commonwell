"use client";
export default function ErrorPage({reset}:{error:Error;reset:()=>void}) { return <main className="error-page"><h1>Let’s try that again.</h1><p>Your membership couldn’t be loaded. Please retry in a moment.</p><button className="button primary" onClick={reset}>Try again</button></main>; }
