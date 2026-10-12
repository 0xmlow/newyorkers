#!/usr/bin/env python3
"""x.py: the smallest X client that can post for @n3wyorkers.

OAuth 1.0a user context. requests-oauthlib signs the requests when it is installed; otherwise the
signature is hand rolled (HMAC-SHA1) and sent with urllib, so the script has no hard dependency.

    upload_media(path)                 v1.1 media/upload, one request. Images over 5 MB are downscaled with PIL.
    upload_video(path)                 v1.1 chunked upload (INIT, APPEND, FINALIZE, STATUS), mp4 up to 512 MB.
    create_post(text, media_ids=None, reply_to=None)     v2 POST /2/tweets
    post(text, media=(), reply_to=None)                  upload whatever media is given, then create the post
    whoami()                           GET /2/users/me, prints the handle and nothing else

Dry run is the default everywhere. A dry run writes the would-be post to outbox/<timestamp>-<tag>.json
and sends nothing. Only X(dry_run=False), which the posters reach with --post, talks to X.

Keys: environment variables X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET, else the macOS
keychain, service "n3wyorkers-x", one generic password per name. Nothing here prints a key, logs a key,
or takes a key on the command line. README.md says how to install them without echoing them.

    python3 x.py --whoami
    python3 x.py --text "a test" --media path.jpg            dry run, lands in outbox/
    python3 x.py --text "a test" --media path.jpg --post     actually posts
"""
import os, sys, json, time, hmac, hashlib, base64, uuid, subprocess, mimetypes, io
import urllib.parse, urllib.request, urllib.error
import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
OUTBOX = os.path.join(HERE, "outbox")
API = "https://api.x.com/2"
UPLOAD = "https://upload.twitter.com/1.1/media/upload.json"
KEYS = ("X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_SECRET")
SERVICE = "n3wyorkers-x"
IMAGE_CAP = 5 * 1024 * 1024
VIDEO_CAP = 512 * 1024 * 1024
IMAGE_EXT = (".jpg", ".jpeg", ".png", ".webp", ".gif")
VIDEO_EXT = (".mp4", ".mov")

try:
    from requests_oauthlib import OAuth1Session
except ImportError:          # the hand rolled path below is used instead
    OAuth1Session = None


class XError(Exception):
    def __init__(self, status, body):
        super().__init__(f"X returned {status}: {body}")
        self.status, self.body = status, body


def _keychain(account):
    """One secret from the login keychain. The value never passes through a command line of ours."""
    r = subprocess.run(["security", "find-generic-password", "-s", SERVICE, "-a", account, "-w"],
                       capture_output=True, text=True)
    return r.stdout.strip() if r.returncode == 0 else ""


def credentials():
    c = {k: os.environ.get(k) or _keychain(k) for k in KEYS}
    missing = [k for k, v in c.items() if not v]
    if missing:
        raise SystemExit("missing X credentials: " + ", ".join(missing) +
                         f" (environment, or keychain service {SERVICE}). README.md says how to add them.")
    return c


def _pct(s):
    return urllib.parse.quote(str(s), safe="-._~")


def _multipart(fields, files):
    """A multipart/form-data body by hand. files = {field: (filename, bytes, mime)}."""
    b = "----n3wyorkers" + uuid.uuid4().hex
    out = io.BytesIO()
    for k, v in fields.items():
        out.write(f"--{b}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode())
    for k, (name, blob, mime) in files.items():
        out.write(f"--{b}\r\nContent-Disposition: form-data; name=\"{k}\"; filename=\"{name}\"\r\nContent-Type: {mime}\r\n\r\n".encode())
        out.write(blob); out.write(b"\r\n")
    out.write(f"--{b}--\r\n".encode())
    return out.getvalue(), f"multipart/form-data; boundary={b}"


def image_bytes(path):
    """The file as is when it is under the cap, else a JPEG downscaled with PIL until it fits."""
    name = os.path.basename(path)
    mime = mimetypes.guess_type(path)[0] or "image/jpeg"
    if os.path.getsize(path) <= IMAGE_CAP and path.lower().endswith(IMAGE_EXT):
        return open(path, "rb").read(), name, mime
    from PIL import Image
    im = Image.open(path).convert("RGB")
    side, q = 2048, 90
    while True:
        im2 = im.copy(); im2.thumbnail((side, side))
        buf = io.BytesIO(); im2.save(buf, "JPEG", quality=q, optimize=True)
        if buf.tell() <= IMAGE_CAP or (side <= 1024 and q <= 60): break
        q -= 10 if q > 60 else 0; side -= 256 if q <= 60 else 0
    return buf.getvalue(), os.path.splitext(name)[0] + ".jpg", "image/jpeg"


class X:
    def __init__(self, dry_run=True, tag="x", outbox=OUTBOX):
        self.dry, self.tag, self.outbox = dry_run, tag, outbox
        self._c = None
        self._s = None

    # ---------- credentials and signing ----------
    @property
    def c(self):
        if self._c is None: self._c = credentials()
        return self._c

    def _auth_header(self, method, url, signed_params):
        c = self.c
        o = {"oauth_consumer_key": c["X_API_KEY"], "oauth_nonce": uuid.uuid4().hex, "oauth_signature_method": "HMAC-SHA1",
             "oauth_timestamp": str(int(time.time())), "oauth_token": c["X_ACCESS_TOKEN"], "oauth_version": "1.0"}
        allp = {**signed_params, **o}
        norm = "&".join(f"{_pct(k)}={_pct(v)}" for k, v in sorted(allp.items()))
        base = "&".join([method.upper(), _pct(url), _pct(norm)])
        key = f"{_pct(c['X_API_SECRET'])}&{_pct(c['X_ACCESS_SECRET'])}"
        o["oauth_signature"] = base64.b64encode(hmac.new(key.encode(), base.encode(), hashlib.sha1).digest()).decode()
        return "OAuth " + ", ".join(f'{_pct(k)}="{_pct(v)}"' for k, v in sorted(o.items()))

    def _request(self, method, url, query=None, form=None, json_body=None, files=None):
        """One signed request. Returns (status, parsed json). Raises XError on a non 2xx."""
        query = query or {}
        full = url + ("?" + urllib.parse.urlencode(query) if query else "")
        if OAuth1Session is not None:
            if self._s is None:
                c = self.c
                self._s = OAuth1Session(c["X_API_KEY"], c["X_API_SECRET"], c["X_ACCESS_TOKEN"], c["X_ACCESS_SECRET"])
            kw = {"timeout": 180}
            if json_body is not None: kw["json"] = json_body
            elif files: kw["data"] = form or {}; kw["files"] = {k: (n, b, m) for k, (n, b, m) in files.items()}
            elif form: kw["data"] = form
            r = self._s.request(method.upper(), full, **kw)
            if r.status_code >= 300: raise XError(r.status_code, r.text[:600])
            return r.status_code, (r.json() if r.text.strip() else {})
        # hand rolled: multipart and JSON bodies are not part of the OAuth signature, form bodies are
        signed = dict(query) if (files or json_body is not None) else {**query, **(form or {})}
        headers = {"Authorization": self._auth_header(method, url, signed), "User-Agent": "n3wyorkers-post/1"}
        body = None
        if json_body is not None:
            body = json.dumps(json_body).encode(); headers["Content-Type"] = "application/json"
        elif files:
            body, headers["Content-Type"] = _multipart(form or {}, files)
        elif form:
            body = urllib.parse.urlencode(form).encode(); headers["Content-Type"] = "application/x-www-form-urlencoded"
        req = urllib.request.Request(full, body, headers, method=method.upper())
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                raw = r.read()
                return r.status, (json.loads(raw) if raw.strip() else {})
        except urllib.error.HTTPError as e:
            raise XError(e.code, e.read().decode(errors="replace")[:600])

    # ---------- media ----------
    def upload_media(self, path):
        """An image. Returns the media id string (or a dry: placeholder)."""
        blob, name, mime = image_bytes(path)
        if self.dry: return "dry:" + os.path.basename(path)
        _, r = self._request("POST", UPLOAD, form={"media_category": "tweet_image"}, files={"media": (name, blob, mime)})
        return r["media_id_string"]

    def upload_video(self, path):
        """Chunked upload for an mp4: INIT, APPEND in 4 MB segments, FINALIZE, then poll STATUS until processed."""
        size = os.path.getsize(path)
        if size > VIDEO_CAP: raise XError(0, f"video over 512 MB ({size // 2**20} MB); use the X cut")
        if self.dry: return "dry:" + os.path.basename(path)
        _, r = self._request("POST", UPLOAD, form={"command": "INIT", "media_type": "video/mp4", "total_bytes": str(size), "media_category": "tweet_video"})
        mid = r["media_id_string"]
        with open(path, "rb") as f:
            for i, chunk in enumerate(iter(lambda: f.read(4 * 1024 * 1024), b"")):
                self._request("POST", UPLOAD, form={"command": "APPEND", "media_id": mid, "segment_index": str(i)},
                              files={"media": ("chunk", chunk, "application/octet-stream")})
        _, r = self._request("POST", UPLOAD, form={"command": "FINALIZE", "media_id": mid})
        info = r.get("processing_info") or {}
        while info.get("state") in ("pending", "in_progress"):
            time.sleep(int(info.get("check_after_secs") or 5))
            _, r = self._request("GET", UPLOAD, query={"command": "STATUS", "media_id": mid})
            info = r.get("processing_info") or {}
        if info.get("state") == "failed":
            raise XError(0, "video processing failed: " + json.dumps(info.get("error"))[:200])
        return mid

    # ---------- posts ----------
    def _outbox(self, record):
        os.makedirs(self.outbox, exist_ok=True)
        n = datetime.datetime.now()
        p = os.path.join(self.outbox, n.strftime("%Y%m%d-%H%M%S") + f"-{n.microsecond:06d}-{self.tag}.json")
        with open(p, "w", encoding="utf-8") as f:
            json.dump(record, f, indent=1, ensure_ascii=False)
        return p

    def create_post(self, text, media_ids=None, reply_to=None, media_paths=()):
        """POST /2/tweets. In a dry run the post is written to the outbox instead and nothing is sent."""
        rec = {"at": datetime.datetime.now().astimezone().isoformat(timespec="seconds"), "script": self.tag,
               "text": text, "media": list(media_paths), "reply_to": reply_to, "dry_run": self.dry}
        if self.dry:
            rec["outbox"] = self._outbox(rec)
            return rec
        body = {"text": text}
        if media_ids: body["media"] = {"media_ids": [str(m) for m in media_ids]}
        if reply_to: body["reply"] = {"in_reply_to_tweet_id": str(reply_to)}
        _, r = self._request("POST", API + "/tweets", json_body=body)
        rec["id"] = (r.get("data") or {}).get("id")
        rec["url"] = f"https://x.com/i/status/{rec['id']}" if rec["id"] else None
        rec["outbox"] = self._outbox(rec)        # sent posts are kept too, as the record of what went out
        return rec

    def post(self, text, media=(), reply_to=None):
        """Upload each media file (images or one mp4), then create the post. Returns the record."""
        ids = []
        for m in media:
            ids.append(self.upload_video(m) if m.lower().endswith(VIDEO_EXT) else self.upload_media(m))
        return self.create_post(text, media_ids=ids if not self.dry else None, reply_to=reply_to, media_paths=media)

    def whoami(self):
        """Verify the keys. Prints the handle and the id, never anything else."""
        _, r = self._request("GET", API + "/users/me")
        d = r.get("data") or {}
        print(f"@{d.get('username')} (id {d.get('id')})")
        return d


def main(argv):
    import argparse
    ap = argparse.ArgumentParser(description="X client for @n3wyorkers. Dry run unless --post.")
    ap.add_argument("--whoami", action="store_true", help="GET /2/users/me to check the keys")
    ap.add_argument("--text", help="post this text")
    ap.add_argument("--media", nargs="*", default=[], help="image or mp4 paths to attach")
    ap.add_argument("--reply-to", help="post id to reply to")
    ap.add_argument("--post", action="store_true", help="actually send. Without it the post lands in outbox/")
    a = ap.parse_args(argv)
    x = X(dry_run=not a.post, tag="x")
    if a.whoami:
        x.whoami(); return
    if not a.text:
        ap.print_help(); return
    rec = x.post(a.text, a.media, a.reply_to)
    print(("posted, record at " if a.post else "dry run, written to ") + rec["outbox"])


if __name__ == "__main__":
    main(sys.argv[1:])
