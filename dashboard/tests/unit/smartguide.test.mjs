import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assignmentSmartGuideCanContinue,
  smartGuideStepIndex,
  assignmentSmartGuideSteps,
} from "../../src/lib/costacciaro-smartguide.ts";

const base = { day: "29 ottobre", slot: "Mattina", activity: "Accoglienza", resolvedMembers: 1, unresolvedMembers: 0 };

test("guide assignment has precisely four distinct steps", () => {
  assert.equal(assignmentSmartGuideSteps.length, 4);
  assert.equal(new Set(assignmentSmartGuideSteps.map(s => s.id)).size, 4);
  for (const s of assignmentSmartGuideSteps) {
    assert.ok(s.focus);
    assert.ok(s.target);
    assert.ok(s.title);
  }
});

test("date/slot step cannot advance without both selections", () => {
  assert.equal(assignmentSmartGuideCanContinue(0, { ...base, day: "" }), false);
  assert.equal(assignmentSmartGuideCanContinue(0, { ...base, slot: "" }), false);
  assert.equal(assignmentSmartGuideCanContinue(0, base), true);
});

test("activity step cannot advance with missing activity", () => {
  assert.equal(assignmentSmartGuideCanContinue(1, { ...base, activity: "" }), false);
  assert.equal(assignmentSmartGuideCanContinue(1, base), true);
});

test("member steps reject empty or unresolved assignments", () => {
  for (const step of [2, 3]) {
    assert.equal(assignmentSmartGuideCanContinue(step, { ...base, resolvedMembers: 0 }), false);
    assert.equal(assignmentSmartGuideCanContinue(step, { ...base, unresolvedMembers: 1 }), false);
    assert.equal(assignmentSmartGuideCanContinue(step, base), true);
  }
});

test("step transitions reject unauthorized advance", () => {
  assert.equal(smartGuideStepIndex(1, 2, 4, false), null);
  assert.equal(smartGuideStepIndex(1, 2, 4, true), 2);
  assert.equal(smartGuideStepIndex(1, 0, 4, false), 0);
});

test("invalid/edge transitions are clamped or explicitly rejected", () => {
  assert.equal(smartGuideStepIndex(null, 0, 0, true), null);
  assert.equal(smartGuideStepIndex(null, -4, 4, true), 0);
  assert.equal(smartGuideStepIndex(3, 30, 4, true), 3);
  assert.equal(assignmentSmartGuideCanContinue(null, base), false);
});
