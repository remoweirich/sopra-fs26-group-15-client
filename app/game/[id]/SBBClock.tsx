"use-client";

import { useEffect, useState } from "react";

interface ClockProps {
  timeStr: string; // Format "HH:MM"
  size?: number; // Optional size for the clock
}

/* SBB-Uhr — Hour & minute show train scenario time; second hand sweeps for life */
const SBBClock: React.FC<ClockProps>=({timeStr, size=86})=>{
  const [h,m]=(timeStr||"10:00").split(":").map(Number);
  const [sec,setSec]=useState(()=>new Date().getSeconds());
  useEffect(()=>{const t=setInterval(()=>setSec(s=>(s+1)%60),1000);return()=>clearInterval(t);},[]);
  const hAng=((h%12)*30)+(m*0.5);
  const mAng=(m||0)*6;
  const sAng=sec*6;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{display:"block"}}>
      <circle cx="50" cy="50" r="49" fill="#fff" stroke="#1C1917" strokeWidth="0.8"/>
      {/* 12 thick hour markers */}
      {Array.from({length:12},(_,i)=>(
        <rect key={`h${i}`} x="48.5" y="2" width="3" height="11" fill="#1C1917" transform={`rotate(${i*30} 50 50)`}/>
      ))}
      {/* 48 thin minute markers (skip hour positions) */}
      {Array.from({length:60},(_,i)=>i%5===0?null:(
        <rect key={`m${i}`} x="49.55" y="2" width="0.9" height="4.5" fill="#1C1917" transform={`rotate(${i*6} 50 50)`}/>
      ))}
      {/* Hour hand — short, thick, blunt */}
      <g transform={`rotate(${hAng} 50 50)`}>
        <rect x="46.8" y="22" width="6.4" height="32" fill="#1C1917"/>
      </g>
      {/* Minute hand — long, slimmer */}
      <g transform={`rotate(${mAng} 50 50)`}>
        <rect x="47.7" y="8" width="4.6" height="46" fill="#1C1917"/>
      </g>
      {/* Second hand — iconic red with disc */}
      <g transform={`rotate(${sAng} 50 50)`} style={{transition:"transform 0.18s cubic-bezier(.4,2.2,.6,1)"}}>
        <rect x="49.3" y="13" width="1.4" height="42" fill="#EB0000"/>
        <circle cx="50" cy="20" r="5.2" fill="#EB0000"/>
      </g>
      {/* Centre pin */}
      <circle cx="50" cy="50" r="2.4" fill="#1C1917"/>
    </svg>
  );
};
export default SBBClock;