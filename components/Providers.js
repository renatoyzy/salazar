"use client";

import { SessionProvider } from "next-auth/react";
import { ProgressProvider } from '@bprogress/next/app';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <ProgressProvider
        height="2px"
        color="#ffffffff"
        options={{ showSpinner: false }}
        shallowRouting
      >
        {children}
      </ProgressProvider>
    </SessionProvider>
  );
}
