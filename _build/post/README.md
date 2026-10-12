# The posting pipeline, @n3wyorkers

Four posters and one client, all in this folder. Every poster is a dry run by default: it writes the
would-be post to `outbox/<timestamp>-<script>.json` and sends nothing. Only `--post` talks to X.
Nothing in here prints a key, writes a key to a file, or takes a key on the command line.

| File | What it does |
|---|---|
| `x.py` | The X client. OAuth 1.0a user context, v1.1 media upload (images, chunked video), v2 create post, `--whoami`. |
| `mint_watch.py` | THE LAST 361. A post per census mint, or one summary with a 2x2 grid when more than three land at once. |
| `daily.py` | NEW YORKER OF THE DAY. The same entry the home page shows, two sentences, the painting, the link. |
| `rollcall.py` | HONOREE ROLL CALL. Forty honorees a day hear their face is on the wall in room 183. Plan in `rollcall_plan.json`. |
| `films.py` | One finished film a day from the film folders. Queue in `films_queue.json`. |
| `common.py` | Paths, New York time, data.js, state.json, the outbox. |
| `holds.txt` | Honorees the roll call must not tag. One per line. |
| `state.json` | What has been posted. Written by the scripts; delete a key to let it post again. |
| `launchd/` | Four agents: mint watch every ten minutes, daily at 08:00, roll call at 10:00, films at 12:00. |

## 1. Put the keys in the keychain, without echoing them

Make an X developer app on the @n3wyorkers account with Read and Write permission, generate the user access
token and secret there, then run each of these four lines. `security` prompts for the value and nothing you
type lands in the shell history.

```bash
security add-generic-password -s n3wyorkers-x -a X_API_KEY -w
security add-generic-password -s n3wyorkers-x -a X_API_SECRET -w
security add-generic-password -s n3wyorkers-x -a X_ACCESS_TOKEN -w
security add-generic-password -s n3wyorkers-x -a X_ACCESS_SECRET -w
```

To replace one, add `-U` to the same line. The scripts read them with
`security find-generic-password -s n3wyorkers-x -a <name> -w`; the first time, macOS asks whether
`/usr/bin/python3` may read the item. Choose Always Allow or the launchd jobs will stall on the prompt.

Environment variables with the same four names override the keychain, for a one off shell.

Check the keys are the right account before anything else:

```bash
cd "NEW YORKERS SITE/_build/post"
python3 x.py --whoami          # prints @n3wyorkers (id ...) and nothing else
```

## 2. Dry runs

```bash
python3 mint_watch.py --replay 1     # compose the latest mint as if it just happened
python3 mint_watch.py --refresh      # read the chain first (public Blockscout, no key), then preview what is new
python3 daily.py                     # today's New Yorker
python3 daily.py --date 2026-10-12   # another day's
python3 rollcall.py --plan-only      # write rollcall_plan.json, read it
python3 rollcall.py --day 1          # day one's forty, into outbox/
python3 films.py --queue-only        # write films_queue.json
python3 films.py                     # the next film in the queue, into outbox/
cat outbox/*.json                    # what would have gone out
```

Each outbox file carries the text, the media paths and `"dry_run": true`.

## 3. Arming

Add `--post` to any of them. Posted records land in the same outbox with the post id and url.

- `mint_watch.py --post` sets its watermark at the latest mint on its first armed run and posts nothing,
  so arming never replays the 750 that already minted. From then on every new mint posts. The watermark
  only moves with `--post`; dry runs never touch it.
- `daily.py --post` is idempotent per New York day. `--force` to repost.
- `rollcall.py --post` fires the next unfired day with ninety seconds between posts (an hour for forty).
  `--day N --post` fires a specific day. Fired days are recorded and refused a second time.
  `--name-first` moves the @handle to the end of the first sentence; a post that starts with @handle is
  hidden from the home timeline of anyone who does not follow both accounts. MLow's call.
- `films.py --post` sends the next film marked ready. Films over 512 MB are marked manual (post the X cut).
  Films over 140 s need X Premium on the account; the queue says which.

## 4. launchd

The four plists in `launchd/` run `/usr/bin/python3` on the absolute path of each script, as dry runs.
To arm one, add `<string>--post</string>` to its ProgramArguments and reload it.

```bash
cp launchd/com.n3wyorkers.post.*.plist ~/Library/LaunchAgents/
for n in mint_watch daily rollcall films; do launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.n3wyorkers.post.$n.plist; done
launchctl list | grep n3wyorkers          # the four should be listed
launchctl kickstart -k gui/$(id -u)/com.n3wyorkers.post.daily   # run one now
```

Logs go to `logs/<name>.log` in this folder. To stop one:
`launchctl bootout gui/$(id -u)/com.n3wyorkers.post.<name>`.

The calendar jobs fire in the Mac's own time zone. The plists set TZ to America/New_York for the script,
but launchd's 08:00 is the Mac's 08:00; if the Mac travels, the posts travel with it. The agents only run
while you are logged in; a sleeping Mac runs a missed calendar job once when it wakes.

## 5. Copy rules the scripts follow

No em or en dashes anywhere (`common.no_dash`). @n3wyorkers copy is plain, two sentences, the second lands
bare, then the link. No dates burned into any image. The collector's @handle is tagged when identity.json
or chain.json knows it, else the ENS name, else the short wallet. The work is never called a product.
