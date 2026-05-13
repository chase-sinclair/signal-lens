import assert from "node:assert/strict";
import { prefilterChunk } from "../src/lib/signal-prefilter";
import { sellerProfiles } from "../src/lib/signal-profile";

const boilerplate =
  "Cybersecurity risks may affect our business. We rely on information systems and may face cyber threats in the ordinary course of operations.";

const concrete =
  "On May 1, the company disclosed that it experienced unauthorized access to customer data. The company began incident response and remediation activities.";

const boilerplateMatches = prefilterChunk(boilerplate);
assert.ok(boilerplateMatches.length > 0, "boilerplate should match keywords");
assert.ok(
  boilerplateMatches.every((match) => match.isBoilerplate),
  "boilerplate-only language should be suppressed",
);

const concreteMatches = prefilterChunk(concrete);
assert.ok(
  concreteMatches.some((match) => !match.isBoilerplate),
  "concrete breach language should produce an actionable candidate",
);

console.log("signal-prefilter fixtures passed");

assert.ok(
  sellerProfiles.some((profile) => profile.companyName === "Datadog"),
  "Datadog profile should be seeded in the seller catalog",
);
assert.ok(
  sellerProfiles.some((profile) => profile.companyName === "Workday"),
  "Workday profile should be seeded in the seller catalog",
);
