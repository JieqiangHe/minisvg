#!/usr/bin/env python3
"""Element-by-element SVG comparison.

    svgdiff.py original.svg exported.svg              # whole document
    svgdiff.py original.svg exported.svg --prefix i1_ # an imported copy (ids/refs carry the prefix)

Elements are matched by id (or by tree path when they have none). Attribute values are
compared as raw strings, so any change of precision counts as a change. Whitespace-only
text is ignored.
"""
import argparse
import re
import sys
import xml.etree.ElementTree as ET


def local(tag):
    return tag.split('}')[-1]


def index(path, prefix=None):
    root = ET.parse(path).getroot()
    out = {}

    def unprefix(v):
        v = re.sub(r'url\(\s*([\'"]?)#' + re.escape(prefix), r'url(\1#', v)
        return '#' + v[1 + len(prefix):] if v.startswith('#' + prefix) else v

    def walk(e, pkey, inside):
        counts = {}
        for c in e:
            if not isinstance(c.tag, str):
                continue
            eid = c.get('id') or ''
            mine = prefix is None or inside or eid.startswith(prefix)
            if prefix and eid.startswith(prefix):
                eid = eid[len(prefix):]
            counts[c.tag] = counts.get(c.tag, 0) + 1
            key = eid or f'{pkey}/{local(c.tag)}[{counts[c.tag]}]'
            if mine:
                attrs = {k: unprefix(v) for k, v in c.attrib.items()} if prefix else dict(c.attrib)
                if prefix and eid:
                    attrs['id'] = eid
                text = c.text if c.text and c.text.strip() else ''
                out[key] = (local(c.tag), attrs, unprefix(text) if prefix else text)
            walk(c, key, mine and prefix is not None)

    walk(root, '', False)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('a')
    ap.add_argument('b')
    ap.add_argument('--prefix')
    ap.add_argument('-q', action='store_true', help='summary only')
    o = ap.parse_args()
    A, B = index(o.a), index(o.b, o.prefix)
    if o.prefix:
        A = {k: v for k, v in A.items() if k in B or v[0] not in ('namedview', 'defs')}
    changed, removed = [], [k for k in A if k not in B]
    added = [k for k in B if k not in A]
    for k in A:
        if k in B and A[k] != B[k]:
            (ta, aa, xa), (tb, ab, xb) = A[k], B[k]
            d = [f'    {n}: {aa.get(n)!r} -> {ab.get(n)!r}' for n in sorted(set(aa) | set(ab), key=str) if aa.get(n) != ab.get(n)]
            if xa != xb:
                d.append(f'    #text: {xa!r} -> {xb!r}')
            changed.append((k, ta, d))
    same = sum(1 for k in A if k in B and A[k] == B[k])
    print(f'{o.a}: {len(A)} elements, {o.b}: {len(B)} elements')
    print(f'unchanged {same}, changed {len(changed)}, removed {len(removed)}, added {len(added)}')
    if not o.q:
        for k, t, d in changed:
            print(f'~ {t}#{k}')
            print('\n'.join(x if len(x) < 200 else x[:197] + '...' for x in d))
        for k in removed:
            print(f'- {A[k][0]}#{k}')
        for k in added:
            print(f'+ {B[k][0]}#{k}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
