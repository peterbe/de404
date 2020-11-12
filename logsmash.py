import json
import sys

c = 0
inp, out = sys.argv[1:]
assert out.endswith('.log'), out
with open(out, 'w') as w:
    lines = []
    unique = set()
    with open(inp) as f:
        for line in f:
            split = line.split('\t')
            try:
                if split[8] != '404':
                    continue
            except IndexError:
                continue
            pathname = split[7]
            if not pathname.startswith('/en-US/docs/') or pathname.endswith('.png') or pathname.endswith('.svg'):
                continue
            if pathname.endswith('.jsp') or pathname.endswith('.php') or pathname.endswith('.aspx'):
                continue
            if len(pathname) > 130 or ':' in pathname or 'docs/Archive' in pathname or 'Mozilla/Thunderbird' in pathname or 'Mozilla/Add-ons' in pathname:
                continue

            if pathname in unique:
                continue
            unique.add(pathname)
            # lines.append(pathname)
            print(len(pathname), pathname)
            w.write(f'{pathname}\n')
            c += 1
            if c > 10000:
                print("BREAK!")
                break
    # json.dump(lines, w, indent=2)
