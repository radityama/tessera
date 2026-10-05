# Product Specification

## Problem

Coding agents are fast at producing frontend code but frequently recreate generic UI even when high-quality implementations already exist.

The existing ecosystem is fragmented:

- each component library has its own structure,
- categories are inconsistent,
- installation instructions differ,
- visual style is hard to search,
- dependency cost is rarely normalized,
- coding agents often do not know when to search rather than generate.

This leads to generic output, duplicated effort, avoidable bugs, and pages that look like disconnected snippets from different design systems.

## Product

Tessera is a retrieval and decision layer between coding agents and UI component ecosystems.

Tessera does not generate the final page. It helps an agent find better building blocks and make informed reuse decisions.

## Target users

Primary:

- coding agents,
- developers using coding agents,
- AI-native IDEs and agent frameworks.

Secondary:

- frontend engineers searching across multiple component ecosystems,
- design engineers building prototypes quickly.

## Primary job-to-be-done

When I ask an agent to build an interface, help it discover relevant existing components before it reinvents visually complex UI, while preserving the design language of my project.

## v0.1 capabilities

- normalized curated registry,
- text search,
- structured filters,
- deterministic ranking,
- score explanations,
- component detail lookup,
- installation guidance,
- similar component discovery,
- CLI,
- MCP server,
- agent skill.

## v0.1 non-goals

- screenshot-to-component matching,
- hosted indexing infrastructure,
- visual embeddings,
- autonomous browser crawling,
- auto-editing arbitrary user repositories,
- automatic license interpretation,
- code generation model,
- Figma import.

## Product principles

### Search before significant invention

For visually significant UI, agents should check whether a high-quality implementation already exists.

### Product-specific UI remains product-specific

Do not force reuse when the UI encodes unique product behavior or domain semantics.

### Cohesion beats local beauty

A slightly less impressive component that fits the page is better than a visually spectacular component that breaks the page's design language.

### Explain retrieval decisions

Users and agents should understand why a component ranked highly.

### Safe by default

Unknown license status, unclear dependency requirements, or ambiguous installation instructions must be surfaced explicitly.
