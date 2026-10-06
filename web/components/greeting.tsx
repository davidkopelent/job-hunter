"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

function greeting(): string {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

// Uses the browser's clock (the server's time zone is UTC); the server renders "Hello".
export function Greeting({ name }: { name: string }) {
  const text = useSyncExternalStore(subscribe, greeting, () => "Hello");
  return (
    <>
      {text}, {name}
    </>
  );
}
