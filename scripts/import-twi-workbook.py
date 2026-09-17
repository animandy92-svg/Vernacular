"""Read the supplied vocabulary workbook without editing it. Requires openpyxl."""
import hashlib
import json
from pathlib import Path
import sys

import openpyxl

source = Path(sys.argv[1])
workbook = openpyxl.load_workbook(source, read_only=True, data_only=True)
sheet = workbook['English-Twi Vocabulary']
values = list(sheet.values)
expected = ['No.', 'English word / expression', 'Twi translation', 'Category']
if list(values[0]) != expected:
    raise ValueError('Unexpected vocabulary columns')
rows = [list(row) for row in values[1:] if any(value is not None for value in row)]
if len(rows) != 3000 or [row[0] for row in rows] != list(range(1, 3001)):
    raise ValueError('Expected 3,000 consecutively numbered entries')
if any(not isinstance(value, str) or not value.strip() for row in rows for value in row[1:]):
    raise ValueError('Missing word, translation or category')
metadata = {
    'source': source.name,
    'sheet': sheet.title,
    'sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
    'columns': expected,
    'notes': [list(row) for row in workbook['Notes & Sources'].values][1:],
}
destination = Path(__file__).resolve().parents[1] / 'src/data/twi-everyday.json'
header = json.dumps(metadata, ensure_ascii=False, indent=2)[:-2]
destination.write_text(header + ',\n  "rows": [\n' + ',\n'.join('    ' + json.dumps(row, ensure_ascii=False) for row in rows) + '\n  ]\n}\n', encoding='utf-8')
workbook.close()
print(f'Imported {len(rows)} source rows into {destination.name}')
