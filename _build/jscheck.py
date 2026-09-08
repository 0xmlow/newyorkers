"""Flag calls to functions that nothing in the same inline script declares.

node --check proves a script PARSES. It cannot know that walletProblem() was deleted by an edit
while its call sites stayed: that is a ReferenceError at click time, on a page that looks
completely healthy. Deliberately narrow: bare `name(` calls only, never member calls, and
comments plus string literals are stripped first so prose and CSS cannot masquerade as code.
"""
import re

KEYWORDS = set("""if for while switch catch return typeof void delete new function class await async
yield else do try finally throw case var let const in of instanceof export import default extends""".split())

BROWSER = set("""Array Object String Number Boolean Math JSON Date RegExp Error Promise Map Set WeakMap
Symbol BigInt Proxy Reflect Intl URL URLSearchParams TextEncoder TextDecoder Blob File FormData
Headers Request Response AbortController Event CustomEvent EventTarget Node Element HTMLElement Image
parseInt parseFloat isNaN isFinite encodeURIComponent decodeURIComponent encodeURI decodeURI
setTimeout setInterval clearTimeout clearInterval requestAnimationFrame queueMicrotask structuredClone
fetch alert confirm prompt atob btoa super this arguments constructor
addEventListener removeEventListener dispatchEvent getComputedStyle matchMedia scrollTo scrollBy
open close postMessage focus blur print reportError
getSelection getComputedStyle scroll stop confirm btoa atob createImageBitmap""".split())

def _strip(js):
    js = re.sub(r'/\*[\s\S]*?\*/', ' ', js)                      # block comments
    js = re.sub(r'(^|[^:])//[^\n]*', r'\1', js)                  # line comments, sparing http://
    js = re.sub(r'`(?:\\.|[^`\\])*`', '""', js)                  # template literals
    js = re.sub(r"'(?:\\.|[^'\\\n])*'", '""', js)
    js = re.sub(r'"(?:\\.|[^"\\\n])*"', '""', js)
    return js

DECL = [
    re.compile(r'\bfunction\s+([A-Za-z_$][\w$]*)'),
    re.compile(r'\bclass\s+([A-Za-z_$][\w$]*)'),
    re.compile(r'\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)'),
    re.compile(r'\b([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b|\()'),
    re.compile(r'\b(?:const|let|var)\s*\{([^}]*)\}'),
]
CALL = re.compile(r'(?<![.\w$])(?<!\bget\s)(?<!\bset\s)([A-Za-z_$][\w$]*)\s*\(')

# globals provided by vendored libraries and site.js
EXTERNAL = set("$ NY qrcode THREE ethers gtag keccak256 keccak_256".split())

def undefined_calls(js, extra_declared=()):
    js = _strip(js)
    declared = set()
    for rx in DECL:
        for m in rx.finditer(js):
            for part in m.group(1).split(","):
                n = part.split(":")[-1].strip().strip(".")
                if re.fullmatch(r'[A-Za-z_$][\w$]*', n): declared.add(n)
    for m in re.finditer(r'\bfunction\s*[\w$]*\s*\(([^()]*)\)', js):
        for part in m.group(1).split(","):
            n = part.split("=")[0].strip().lstrip(".").strip()
            if re.fullmatch(r'[A-Za-z_$][\w$]*', n): declared.add(n)
    for m in re.finditer(r'(?<![.\w$])([A-Za-z_$][\w$]*)\s*=>', js):
        declared.add(m.group(1))
    for m in re.finditer(r'\(([^()]*)\)\s*=>', js):
        for part in m.group(1).split(","):
            n = part.split("=")[0].strip().lstrip(".").strip()
            if re.fullmatch(r'[A-Za-z_$][\w$]*', n): declared.add(n)
    bad = []
    for m in CALL.finditer(js):
        n = m.group(1)
        if n in declared or n in KEYWORDS or n in BROWSER or n in EXTERNAL: continue
        if n in extra_declared: continue
        if n[0].isupper() or n.startswith("__"): continue
        bad.append(n)
    return sorted(set(bad))


def declared_in(blocks):
    """Every name declared anywhere on the page: script blocks share one global scope."""
    d = set()
    for b in blocks:
        t = _strip(b)
        for rx in DECL:
            for m in rx.finditer(t):
                for part in m.group(1).split(","):
                    n = part.split(":")[-1].strip().strip(".")
                    if re.fullmatch(r'[A-Za-z_$][\w$]*', n): d.add(n)
    return d
