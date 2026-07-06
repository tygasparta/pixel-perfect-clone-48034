I'll build Beatify — Zimbabwe's music streaming platform — matching the mockups exactly (dark theme, red #FF4433 accent). This is a large scope, so I'll ship it in a focused first pass, then iterate.

## Phase 1 (this build)

**Backend (Lovable Cloud)**
- Enable Cloud (Postgres + Auth + Storage)
- Tables: `profiles`, `tracks`, `likes`, `playlists`, `playlist_tracks`, `follows`, `plays`
- Storage buckets: `audio` (private, signed URLs), `covers` (public), `avatars` (public)
- RLS on every table; `user_roles` + `has_role()` for admin
- Auth: email/password + Google

**Frontend screens (mobile-first, exact mockup match)**
1. Splash / Welcome (Beatify logo, gradient portrait, social sign-in)
2. Home — Trending in Zimbabwe, New Releases, Made For You, mini-player
3. Search — trending searches, genre grid, mood chips, top artists
4. Player — full-screen art, waveform, controls, lyrics/queue tabs
5. Artist page — hero portrait, Play/Follow, popular tracks, albums
6. Library — tabs (Playlists/Albums/Songs/Podcasts), Liked/Downloaded rows
7. Upload — drag-drop, title/artist/genre fields, distribution wizard
8. Analytics — streams/listeners/earnings cards, chart, top songs
9. Wallet — balance card, EcoCash/Visa payout methods, transactions
10. Notifications — activity feed
11. Profile / Settings — account, subscription, dark mode toggle, logout

**Design system (matches mockups)**
- Dark bg `oklch(0.14 0.01 20)`, card `oklch(0.19 0.01 20)`
- Primary red `oklch(0.62 0.22 25)` (~#FF4433), red-glow gradient
- Font: Inter for body, tighter for display (or SF-alike)
- Bottom tab bar: Home / Search / Library / Upload / Profile
- Rounded 12–16px, subtle borders `oklch(1 0 0 / 0.08)`

## Phase 2 (follow-up turns, on request)
- Real audio transcoding pipeline (HLS), offline downloads
- EcoCash/Pesepay integration for payouts & subscriptions
- Recommendation engine, social features (comments/reposts)
- Desktop layouts from image 2

## Notes
- Sample tracks: I'll seed 3–5 demo tracks using royalty-free audio + generated cover art so the player actually plays on first load.
- Audio streams via signed URLs from the private `audio` bucket.
- I'll ask about profile display name on first signup.

Ready to build?