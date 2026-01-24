#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
将 1.24-简化版 csv 复制到仓库 data/csv/，图片复制到 images/<日期>/。
日期通过 --date 参数传入。
"""

import sys
import argparse
import shutil
from pathlib import Path

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')


def main():
    parser = argparse.ArgumentParser(
        description='将 1.24-简化版 复制到仓库 data/csv/ 与 images/<日期>/',
        epilog='示例: python sync_csv_images.py --date 1.24'
    )
    parser.add_argument('--date', '-d', required=True, help='日期，用作 images 子目录名，如 1.24')
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parent
    source_base = Path(r'C:\Users\Admin\Desktop\网站\网站：1.24-简化版')
    src_csv = source_base / '1.24-简化版.csv'
    src_images = source_base / 'images'

    dest_csv_dir = repo_root / 'data' / 'csv'
    dest_image_dir = repo_root / 'images' / args.date

    if not src_csv.exists():
        print('[错误] 源 CSV 不存在:', src_csv)
        sys.exit(1)
    if not src_images.exists():
        print('[错误] 源图片目录不存在:', src_images)
        sys.exit(1)

    dest_csv_dir.mkdir(parents=True, exist_ok=True)
    dest_image_dir.mkdir(parents=True, exist_ok=True)

    dest_csv = dest_csv_dir / src_csv.name
    shutil.copy2(src_csv, dest_csv)
    n_csv = 1

    exts = {'.jpg', '.jpeg', '.png', '.webp'}
    n_img = 0
    for f in src_images.iterdir():
        if f.is_file() and f.suffix.lower() in exts:
            shutil.copy2(f, dest_image_dir / f.name)
            n_img += 1

    print('复制数量: CSV', n_csv, '个；图片', n_img, '个')
    print('目标路径:')
    print('  CSV:', dest_csv)
    print('  图片目录:', dest_image_dir)


if __name__ == '__main__':
    main()
