"use client";

import { useSyncExternalStore } from "react";

const pad = (value: number) => String(value).padStart(2, "0");

function subscribe(onTick: () => void) {
  const interval = window.setInterval(onTick, 250);
  return () => window.clearInterval(interval);
}

function readTime() {
  const now = new Date();
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

const readServerTime = () => "";

export function DigitalClock() {
  const time = useSyncExternalStore(subscribe, readTime, readServerTime);
  return (
    <time className="digital-clock">
      {time}
    </time>
  );
}
