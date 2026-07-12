# FlowBench

> Automated testing & benchmarking for Lamatic flows.

<!-- TODO: Fill in full README content -->

## Overview

FlowBench is a pre-merge regression testing tool for Lamatic flows. Give it a flow ID and a set of test cases — it runs every case, scores output quality, measures latency, and compares against a saved baseline.

## Quick Start

```bash
cd apps
cp .env.example .env   # fill in your Lamatic credentials
npm install
npm run dev
```

## Status

🚧 Scaffold only — implementation in progress.

## Known Limitations

Similarity scoring measures semantic closeness, not just factual correctness — a correct but more verbose or more terse response than the reference string may score lower than expected. For best results, calibrate expected_contains reference strings to match your flow's typical response style and verbosity, rather than using minimal keyword-only references.
