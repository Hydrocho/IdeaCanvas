# Auth and Permissions Design

## Goal

Add a lightweight teacher/master account system for Idea Canvas while keeping student use anonymous and simple.

## Scope

This design keeps Supabase Auth's real email/password flow. It does not create student accounts. Students write as guests when a board allows writing.

## Account Model

Users enter:

- Email
- Password
- Name

The email is stored directly in Supabase Auth and can receive normal Supabase email confirmation and password recovery messages.

Stored profile fields:

```sql
profiles (
  user_id uuid primary key references auth.users(id),
  display_name text not null,
  role text not null check (role in ('teacher_pending', 'teacher')),
  is_master boolean not null default false,
  is_primary_master boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
)
```

The first successful signup becomes the primary master:

- `role = 'teacher'`
- `is_master = true`
- `is_primary_master = true`

Later signups become pending teachers:

- `role = 'teacher_pending'`
- `is_master = false`
- `is_primary_master = false`

## Permissions

Guest:

- Cannot log in.
- Can write only when the board's writing feature is ON.
- Must enter an author name before writing.
- Cannot create boards.
- Cannot manage accounts.

Pending teacher:

- Can log in.
- Cannot create boards.
- Cannot write with teacher override.
- Sees an approval-pending state.

Approved teacher:

- Can log in.
- Can create boards.
- Can write regardless of the board writing toggle.
- Cannot manage accounts unless also granted master.

Master:

- Can do everything an approved teacher can do.
- Can approve pending teachers.
- Can grant and revoke non-primary master rights.
- Cannot revoke the primary master's master rights.

Primary master:

- Same as master.
- Cannot lose master rights through the app.

## Board Writing Setting

Replace the current write setting with one board-level toggle:

```text
글쓰기 기능 ON / OFF
```

The setting controls guest writing only.

Effective write rule:

```text
canWrite =
  logged in as approved teacher
  OR logged in as master
  OR board_settings.write_enabled = true
```

When `글쓰기 기능` is ON:

- Guests can write after entering an author name.
- Approved teachers and masters can write.

When `글쓰기 기능` is OFF:

- Guests cannot write.
- Approved teachers and masters can still write.

Pending teachers follow guest writing rules only if they are not treated as an approved teacher. They can write as ordinary guests when `글쓰기 기능` is ON, but not with teacher override.

## Password Recovery

Teachers and masters recover their own passwords through Supabase Auth email recovery.

The app provides a "비밀번호 재설정" action on the login form. It sends a Supabase password recovery email to the entered email address. Masters do not reset other users' passwords in the app.

## Dashboard UI

`index.html` remains the app-level dashboard and gains tabs:

```text
보드 | 계정 관리
```

Board tab:

- Existing board search.
- Board cards.
- New board button.
- New board button visible only to approved teachers and masters.

Account management tab:

- Visible only to masters.
- Pending teacher approvals.
- Approved teacher list.
- Master rights controls.

No student account section is created.

## Board UI

The board settings panel shows exactly one write toggle:

```text
글쓰기 기능  ON / OFF
```

The login form shows:

- Email
- Password
- Signup button
- Login button
- Password recovery button

Signup requests:

- Email
- Password
- Name

No username field is shown to the user.

## Supabase and Security

Browser code may use:

- `supabase.auth.signUp`
- `supabase.auth.signInWithPassword`
- `supabase.auth.resetPasswordForEmail`
- `supabase.auth.updateUser` for the logged-in user's own password change
- ordinary table reads/writes allowed by RLS

Browser code must not use or store:

- `service_role` key
- JWT secret
- database password
- Supabase access token
- real user password lists

Edge Functions are not required for the first implementation because the app does not manage other users' Auth passwords. Teacher approval and master-right changes are handled with RLS-protected `profiles` updates.

If future requirements add administrator-driven password reset, account deletion, or direct Auth user listing, add an Edge Function at that point and keep `service_role` only in Supabase Secrets.

Recommended repo structure:

```text
supabase/
  migrations/
    20260709_auth_roles.sql
  README.md
```

## RLS Direction

Enable RLS for exposed tables.

Required policy behavior:

- Guests can read public board data needed to view a board.
- Guests can insert notes/comments only when `board_settings.write_enabled = true` and author name is present.
- Approved teachers and masters can insert notes/comments regardless of `write_enabled`.
- Approved teachers and masters can create boards.
- Masters can read profiles needed for account management.
- Masters can approve teachers and grant/revoke non-primary master rights through RLS-protected profile updates.
- SQL must prevent primary master demotion and prevent removing the last remaining master.

The implementation plan must define concrete SQL policies for `boards`, `notes`, `comments`, `likes`, `sections`, `board_settings`, and `profiles`, then verify each role with direct Supabase queries.

## Migration Notes

Existing `board_settings.auth_write` is replaced by `write_enabled`.

Migration rule:

```text
write_enabled = not auth_write
```

Rationale:

- Existing `auth_write = true` meant logged-in-only writing.
- The new model removes student/member writing and uses `write_enabled` for guest writing.
- A conservative migration defaults restrictive old boards to guest writing OFF.

Because the app is being redesigned around guest writing and teacher override, existing boards that had `auth_write = true` migrate to `write_enabled = false`.

## Implementation Preconditions

- Configure Supabase Auth email settings and redirect URLs for signup confirmation and password recovery.
- Replace the current RLS-disabled schema with RLS-enabled policies.
- Preserve existing anonymous `author_id` behavior for guest-authored notes while adding authenticated user identity for teacher/master-authored notes.
