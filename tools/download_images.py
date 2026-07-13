# -*- coding: utf-8 -*-
"""
Скачивание картинок по фототипам из krepolit_images_map.xlsx.
Запускать локально (нужен интернет):
    pip install openpyxl duckduckgo-search requests
    python download_images.py
Картинки сохраняются в ./images/<Имя файла> — ровно так, как они
привязаны к SKU на листе «Карта SKU».
"""
import os, time
import requests
from openpyxl import load_workbook
from duckduckgo_search import DDGS

XLSX = "krepolit_images_map.xlsx"
OUT = "images"
PER_TYPE = 1          # сколько картинок сохранять на фототип
PAUSE = 2             # пауза между запросами, сек

os.makedirs(OUT, exist_ok=True)
wb = load_workbook(XLSX)
ws = wb["Фототипы"]

with DDGS() as ddgs:
    for row in ws.iter_rows(min_row=2, values_only=True):
        img_id, path, std, coating, cnt, example, fname, q_ru, q_en, *_ = row
        target = os.path.join(OUT, fname)
        if os.path.exists(target):
            continue
        print(f"{img_id}: {q_ru}")
        try:
            results = list(ddgs.images(q_ru, max_results=PER_TYPE * 3))
            saved = 0
            for r in results:
                try:
                    resp = requests.get(r["image"], timeout=15,
                                        headers={"User-Agent": "Mozilla/5.0"})
                    if resp.ok and len(resp.content) > 10_000:
                        suffix = "" if saved == 0 else f"_{saved+1}"
                        base, ext = os.path.splitext(fname)
                        with open(os.path.join(OUT, base + suffix + ".jpg"), "wb") as f:
                            f.write(resp.content)
                        saved += 1
                        if saved >= PER_TYPE:
                            break
                except Exception:
                    continue
            if not saved:
                print(f"  !! не скачалось: {img_id}")
        except Exception as e:
            print(f"  !! ошибка поиска: {e}")
        time.sleep(PAUSE)

print("Готово. Проверьте папку ./images и права на использование изображений.")
