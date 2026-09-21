"""Import the user-supplied dictionary without modifying its spelling or source metadata."""
import datetime
import hashlib
import json
from pathlib import Path
import sys

import openpyxl


def import_dictionary(source: Path):
    with source.open("rb") as stream:
        digest = hashlib.file_digest(stream, "sha256").hexdigest()
    workbook = openpyxl.load_workbook(source, read_only=True, data_only=True)
    try:
        sheet = workbook["Dictionary"]
        values = list(sheet.values)
        columns = list(values[3])
        expected = ["No.", "Kasem word", "English translation", "Part of speech", "Dialect", "Category", "Pronunciation", "Alternate Kasem terms", "Kasem example", "English example", "Word use rules", "Cultural note", "Audio URL", "Source", "Approved at", "Updated at", "Entry ID"]
        if columns != expected:
            raise ValueError("Unexpected dictionary columns")
        rows = []
        ids = set()
        for source_row, values_row in enumerate(values[4:], start=5):
            if not any(value is not None for value in values_row):
                continue
            row = list(values_row)
            if any(not isinstance(row[index], str) or not row[index].strip() for index in [1, 2, 16]):
                raise ValueError(f"Missing word, translation or source ID at row {source_row}")
            if row[16] in ids:
                raise ValueError(f"Duplicate source ID at row {source_row}")
            ids.add(row[16])
            rows.append({"sourceRow": source_row, "values": [value.isoformat() if isinstance(value, (datetime.datetime, datetime.date)) else value for value in row]})
        if not rows:
            raise ValueError("The dictionary is empty")
        result = {"source": source.name, "sheet": sheet.title, "sha256": digest, "description": values[1][0], "columns": columns, "rows": rows}
        destination = Path(__file__).resolve().parents[1] / "src/data/kasem-dictionary.json"
        destination.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Imported {len(rows)} dictionary rows into {destination.name}")
    finally:
        workbook.close()


if __name__ == "__main__":
    import_dictionary(Path(sys.argv[1]))
