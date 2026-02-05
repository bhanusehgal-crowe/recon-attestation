"use client";

import { useEffect } from "react";
import Script from "next/script";
import { motion } from "motion/react";
import { animate, stagger } from "animejs";

export default function LegacyShell({ html, scriptSrc, needsXlsx = false }) {
  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll(".card, .choice-card, .dropzone, .attestation")
    ).filter((node) => node.offsetParent !== null);
    if (nodes.length === 0) return;
    animate(nodes, {
      opacity: [0, 1],
      translateY: [10, 0],
      delay: stagger(35, { start: 60 }),
      duration: 480,
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
