# Supabase and Cloudinary setup

The application uses Supabase for event statuses, published winners, leaderboard settings, admin membership, and gallery metadata. Cloudinary stores uploaded gallery photos. Static branding, schedules, and informational content remain in the repository.

## Activate your database

1. Open your Supabase project → SQL Editor → New query.
2. Paste and run all of `supabase/setup.sql`. It creates protected tables and seeds the 41 event names with upcoming statuses and no winners. Existing matching rows are preserved when rerun.
3. Open Authentication → Users → Add user and create your admin email/password account. Confirm the email using the dashboard option if necessary.
4. Copy that user's UUID and run this in SQL Editor:

```sql
insert into public.admins (user_id)
values ('YOUR-AUTH-USER-UUID')
on conflict do nothing;
```

An authenticated account only becomes an administrator when explicitly added to this table. Public users cannot add themselves. No service-role key is needed by the application.

## Local development

Credentials supplied for this integration are configured in ignored `.env.local`. For another environment, copy `.env.example` and fill its values. Do not put the Cloudinary API secret in a `NEXT_PUBLIC_` variable.

```sh
npm install
npm run dev
```

Open `/admin` and sign in with the authorized Supabase account. The old demo passcodes no longer work. Rotate the Cloudinary secret shared in chat and replace `CLOUDINARY_API_SECRET` before publishing. Restart the application after changing environment values.

## Behavior

- All data API routes query Supabase rather than local JSON or uploaded files.
- Every admin API requires a verified Supabase access token and an admin membership. Supabase row-level policies independently enforce those permissions.
- An event save requires only 1st place (mandatory). 2nd and 3rd places are optional to accommodate disqualifications or unawarded slots. Points use the existing 5/3/1 rule and derive the squad from the department.
- Manual scores can override automatic scores. Returning to auto mode recalculates from published winners.
- Public pages refresh every 15 seconds while visible and on refocus. No Supabase realtime connection quota is consumed.
- Empty results and gallery responses clear the display. Data outages show an update message instead of dummy winners.
- Gallery uploads go directly from the browser to Cloudinary using a signed request. Supported formats are JPEG, PNG, WebP, AVIF, and HEIC, up to 10 MB. The server verifies the asset before storing its metadata.
- Gallery removal deletes the archive record and retains the Cloudinary asset for recovery. Remove unused media from Cloudinary separately when appropriate. If metadata saving fails after upload, retrying currently uploads a new asset; the unused one can be cleaned up in Cloudinary.
- Gallery images use automatically optimized thumbnail and lightbox URLs. Existing decorative assets are still served locally.
- Registration links and existing festival dates are unchanged; those require separate product decisions.

## Verification

Use Node.js 22 or newer for the supplied test command.

The framework security branch updates Next.js to 16.4.0 and React/React DOM to 19.3.0. It includes the integration branch's changes; `main` is untouched. The integration branch alone retains the original framework versions.

```sh
npm test
npm run build
```

After the SQL setup, verify: public pages show no fake results; a non-admin user cannot write; an admin can change an event status, publish winners, override/reset scores, upload a photo, and remove it. In a second browser tab, updates should appear within 15 seconds. Test refreshes and sign-out too.

The supplied publishable key can query existing tables but cannot execute SQL or create accounts. Full live write checks require the setup above.
