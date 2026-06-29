---
name: create_manager_setting
description: "Creates a new Manager Settings component following DH Notebook's strict SRP and In-App Documentation rules."
---

# Instructions for creating a Manager Setting Feature

When the user asks to create a new setting feature under Manager Tasks, follow these exact steps to ensure Single Responsibility Principle (SRP) and compliance with project rules:

## 1. File Structure
Do NOT create a single massive file. A Manager Setting feature must be broken down into:
- `Page.jsx` (The main container, orchestrates components)
- `use[Feature]State.js` (Custom hook for Firebase interactions and state)
- `[Feature]Form.jsx` (The UI form)
- `[Feature]Guide.jsx` (The In-App Documentation, **MANDATORY**)

## 2. In-App Documentation Rule
Every manager setting feature MUST include a clear explanation UI.
Implement a `Help Panel` or `Guide Modal` (using `[Feature]Guide.jsx`) that explains:
- What the setting does.
- How to use it step-by-step.
- Any tips or expected outcomes.

## 3. Firebase Optimization
- Fetch data only once if it doesn't change frequently.
- Use optimistic updates for snappy UI when saving settings.

## Example Directory (e.g. for `shipping`):
- `src/pages/managers/settings/shipping/ShippingSettingsPage.jsx`
- `src/pages/managers/settings/shipping/useShippingSettings.js`
- `src/pages/managers/settings/shipping/ShippingForm.jsx`
- `src/pages/managers/settings/shipping/ShippingGuide.jsx`
