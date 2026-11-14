"""Build src/data/catalog.json from the public-domain Free Exercise DB.

Source: https://github.com/yuhonas/free-exercise-db (Unlicense / public domain).

Usage:
  python3 -I scripts/build_catalog.py <exercises.json> <out catalog.json> <out image-ids.txt>

Keeps exercises doable with barbell, dumbbells, kettlebells, bands and bodyweight
(plus stretches), skipping anything that needs machines, cables or strongman gear.
"""
import json
import os
import re
import sys

EQUIPMENT = {'barbell', 'dumbbell', 'kettlebells', 'bands', 'body only', None}
SKIP_CATEGORIES = {'strongman', 'cardio'}
SKIP_NAME = re.compile(
    r'smith|machine|cable|leverage|chain|sled|partner|pulley|pulldown|ball|box|board|axle|\bcar\b|rickshaw|'
    r'tire|yoke|\blog\b|keg|atlas|rope|trail|valslide|suspended|pins|blocks|prowler|medicine|bosu|foam|'
    r'gironda|anti-gravity|hanging bar|janda|dip machine|landmine|t-bar|neck|throw|catch|carioca|sprint|'
    r'with a partner|ez[- ]bar|cambered|incline bench pull|bradford',
    re.I,
)
# Exercises the program links to — always kept even if the filters above would drop them.
FORCE = {
    'Face_Pull', 'Farmers_Walk', 'Kneeling_Hip_Flexor', 'Cat_Stretch', 'Childs_Pose',
    'Standing_Hip_Circles', 'Monster_Walk',
}

EQ_MAP = {'barbell': 'barbell', 'dumbbell': 'dumbbell', 'kettlebells': 'kettlebell', 'bands': 'band',
          'body only': 'bodyweight', None: 'bodyweight', 'cable': 'band', 'other': 'bodyweight'}


def main(src, out_json, out_ids):
    data = json.load(open(src))
    keep = []
    for x in data:
        forced = x['id'] in FORCE
        if not forced:
            if x['equipment'] not in EQUIPMENT:
                continue
            if SKIP_NAME.search(x['name']):
                continue
        if x['category'] in SKIP_CATEGORIES and not forced:
            continue
        keep.append({
            'id': x['id'],
            'name': x['name'],
            'equip': EQ_MAP.get(x['equipment'], 'bodyweight'),
            'category': x['category'],
            'level': x['level'],
            'primary': x['primaryMuscles'],
            'secondary': [m for m in x['secondaryMuscles'] if m not in x['primaryMuscles']],
            'steps': x['instructions'],
        })
    keep.sort(key=lambda e: e['name'].lower())
    for e in keep:  # photos live in public/ex/<id>/0.jpg and 1.jpg
        if os.path.exists(f"public/ex/{e['id']}/0.jpg"):
            e['img'] = 1
    with open(out_json, 'w') as f:
        json.dump(keep, f, separators=(',', ':'), ensure_ascii=False)
    with open(out_ids, 'w') as f:
        f.write('\n'.join(e['id'] for e in keep) + '\n')
    print(f'{len(keep)} exercises')


if __name__ == '__main__':
    main(*sys.argv[1:4])
