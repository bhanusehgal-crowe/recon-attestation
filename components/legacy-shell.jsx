"use client";

import { useEffect } from "react";
import Script from "next/script";
import { motion } from "motion/react";
import { animate, stagger } from "animejs";

export default function LegacyShell({ html, scriptSrc, needsXlsx = false }) {
  useEffect(() => {
    animate(".card, .choice-card, .dropzone, .attestation, .pill, .status, .badge", {
      opacity: [0, 1],
      translateY: [16, 0],
      delay: stagger(40, { start: 80 }),
      duration: 600,
      easing: "outQuad",
    });
  }, []);

  return (
    <>
      {needsXlsx ? (
        <Script
          src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"
          strategy="beforeInteractive"
        />
      ) : null}
      {scriptSrc ? <Script src={scriptSrc} strategy="afterInteractive" /> : null}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
      >
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </motion.main>
    </>
  );
}
