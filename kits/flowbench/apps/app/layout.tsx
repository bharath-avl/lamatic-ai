import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowBench — Lamatic Flow Testing & Benchmarking",
  description:
    "Automated regression testing and quality benchmarking for Lamatic flows. Run test suites, measure latency, score output quality, and compare against baselines.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
