# Netlify Setup Guide

This document describes how Netlify builds and hosts the React Single Page Application (SPA).

---

## 1. `netlify.toml` Configuration

The `netlify.toml` file at the project root configures directory paths and Single Page Application (SPA) routing:

```toml
[build]
  base = "client"
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 2. Environment Variables in Netlify

In the Netlify UI under **Site Settings** > **Environment Variables**, configure:

1. `VITE_SUPABASE_URL`: Your Supabase HTTPS URL (e.g. `https://xyz.supabase.co`).
2. `VITE_SUPABASE_ANON_KEY`: Your Supabase anon public key.

---

## 3. SPA Routing Note

The `[[redirects]]` rule ensures that refreshing any deep React route (e.g. `/equation-editor` or `/login`) redirects to `/index.html` with status `200`, allowing React Router to handle client-side routing.
