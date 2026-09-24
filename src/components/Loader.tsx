"use client";

import { useProgress } from "@react-three/drei";
import { useEffect, useState } from "react";
import { getLenis } from "@/lib/lenis";

export default function Loader() {
  const { progress, active } = useProgress();
  const [show, setShow] = useState(true);

  useEffect(() => {
    // If progress is 100 or loading is no longer active after it was, we fade out
    if (progress === 100 || !active) {
      const timeout = setTimeout(() => setShow(false), 500); 
      return () => clearTimeout(timeout);
    }
  }, [progress, active]);

  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
      const interval = setInterval(() => {
        getLenis()?.stop();
      }, 100);
      return () => {
        clearInterval(interval);
        document.body.style.overflow = "";
        getLenis()?.start();
      };
    } else {
      document.body.style.overflow = "";
      getLenis()?.start();
    }
  }, [show]);

  if (!show) return null;

  const isComplete = progress === 100 || !active;

  return (
    <div 
      className={`fixed inset-0 z-[999] flex flex-col items-center justify-center bg-ink text-paper transition-opacity duration-500 ${isComplete ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      <p className="display text-3xl mb-4 text-mustard">Loading...</p>
      <div className="w-64 h-2 bg-paper/20 rounded-full overflow-hidden">
        <div 
          className="h-full bg-mustard transition-all duration-300 ease-out" 
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-4 font-mono text-sm">{Math.round(progress)}%</p>
    </div>
  );
}
