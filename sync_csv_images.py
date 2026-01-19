#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CSV 和图片同步脚本
同步 CSV 文件和图片目录，只保留两者都存在的 ASIN 记录
"""

import os
import sys
import argparse
import shutil
from pathlib import Path
from datetime import datetime
from typing import Set, List, Tuple
import pandas as pd

# 设置输出编码为 UTF-8
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')


class CSVImageSyncer:
    """CSV 和图片同步器"""
    
    SUPPORTED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
    
    def __init__(self, csv_path: str, image_dir: str, trash_dir: str = 'trash'):
        self.csv_path = Path(csv_path)
        self.image_dir = Path(image_dir)
        self.trash_dir = Path(trash_dir)
        self.timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # 验证路径
        if not self.csv_path.exists():
            raise FileNotFoundError(f"CSV 文件不存在: {self.csv_path}")
        if not self.image_dir.exists():
            raise FileNotFoundError(f"图片目录不存在: {self.image_dir}")
    
    def scan_images(self) -> Tuple[Set[str], List[Path]]:
        """
        扫描图片目录，获取所有图片的 ASIN
        
        Returns:
            (image_asins, image_files): ASIN 集合和图片文件路径列表
        """
        image_asins = set()
        image_files = []
        
        for file_path in self.image_dir.iterdir():
            if file_path.is_file() and file_path.suffix.lower() in self.SUPPORTED_EXTENSIONS:
                asin = file_path.stem
                image_asins.add(asin)
                image_files.append(file_path)
        
        return image_asins, image_files
    
    def scan_csv(self) -> Tuple[Set[str], pd.DataFrame]:
        """
        扫描 CSV 文件，获取所有 ASIN
        
        Returns:
            (csv_asins, df): ASIN 集合和 DataFrame
        """
        df = pd.read_csv(self.csv_path)
        
        # 假设第一列是 ASIN
        if 'ASIN' in df.columns:
            asin_column = 'ASIN'
        elif len(df.columns) > 0:
            asin_column = df.columns[0]
        else:
            raise ValueError("CSV 文件没有列")
        
        csv_asins = set(df[asin_column].astype(str).values)
        
        return csv_asins, df
    
    def calculate_intersection(self, csv_asins: Set[str], image_asins: Set[str]) -> Tuple[Set[str], Set[str], Set[str]]:
        """
        计算交集和差集
        
        Returns:
            (keep_asins, csv_only, image_only): 交集、仅在CSV、仅在图片
        """
        keep_asins = csv_asins & image_asins
        csv_only = csv_asins - image_asins
        image_only = image_asins - csv_asins
        
        return keep_asins, csv_only, image_only
    
    def preview_changes(self, keep_asins: Set[str], csv_only: Set[str], image_only: Set[str], 
                       df: pd.DataFrame, image_files: List[Path]):
        """预览将要进行的更改"""
        print("\n" + "="*80)
        print("同步预览 (DRY-RUN 模式)")
        print("="*80)
        
        print(f"\n[统计] 统计信息:")
        print(f"  CSV 记录总数: {len(df)}")
        print(f"  图片文件总数: {len(image_files)}")
        print(f"  CSV 中的 ASIN 数: {len(df[df.columns[0]].unique())}")
        print(f"  图片中的 ASIN 数: {len(set(f.stem for f in image_files))}")
        
        print(f"\n[保留] 保留的 ASIN 数量: {len(keep_asins)}")
        print(f"  (CSV 和图片都存在)")
        
        print(f"\n[删除] 将删除的 CSV 行数: {len(csv_only)}")
        print(f"  (CSV 中有但图片中没有)")
        if csv_only and len(csv_only) <= 20:
            print(f"  示例 ASIN: {', '.join(list(csv_only)[:20])}")
        elif csv_only:
            print(f"  前 20 个 ASIN: {', '.join(list(csv_only)[:20])}")
        
        print(f"\n[移动] 将移动到 trash 的图片数量: {len(image_only)}")
        print(f"  (图片中有但 CSV 中没有)")
        if image_only and len(image_only) <= 20:
            print(f"  示例 ASIN: {', '.join(list(image_only)[:20])}")
        elif image_only:
            print(f"  前 20 个 ASIN: {', '.join(list(image_only)[:20])}")
        
        print(f"\n[备份] 备份位置:")
        print(f"  CSV 备份: {self.trash_dir / self.image_dir.name / 'csv' / f'{self.csv_path.name}.backup.{self.timestamp}'}")
        print(f"  图片备份: {self.trash_dir / self.image_dir.name / 'images'}")
        
        print(f"\n[结果] 同步后:")
        print(f"  CSV 行数: {len(keep_asins) + 1} (含标题)")
        print(f"  图片数量: {len(keep_asins)}")
        
        print("\n" + "="*80)
        print("提示: 使用 --execute 参数执行实际操作")
        print("="*80 + "\n")
    
    def backup_csv(self):
        """备份 CSV 文件"""
        backup_dir = self.trash_dir / self.image_dir.name / 'csv'
        backup_dir.mkdir(parents=True, exist_ok=True)
        
        backup_path = backup_dir / f"{self.csv_path.name}.backup.{self.timestamp}"
        shutil.copy2(self.csv_path, backup_path)
        
        print(f"[OK] CSV 已备份到: {backup_path}")
        return backup_path
    
    def clean_csv(self, keep_asins: Set[str], df: pd.DataFrame):
        """清理 CSV 文件"""
        asin_column = df.columns[0]
        
        # 过滤保留交集中的行
        df_filtered = df[df[asin_column].astype(str).isin(keep_asins)]
        
        # 覆盖写入原文件
        df_filtered.to_csv(self.csv_path, index=False)
        
        deleted_rows = len(df) - len(df_filtered)
        print(f"[OK] CSV 已更新: 删除 {deleted_rows} 行，保留 {len(df_filtered)} 行")
        
        return deleted_rows
    
    def clean_images(self, keep_asins: Set[str], image_files: List[Path]):
        """清理图片文件"""
        trash_image_dir = self.trash_dir / self.image_dir.name / 'images'
        trash_image_dir.mkdir(parents=True, exist_ok=True)
        
        moved_count = 0
        
        for image_file in image_files:
            asin = image_file.stem
            if asin not in keep_asins:
                dest_path = trash_image_dir / image_file.name
                shutil.move(str(image_file), str(dest_path))
                moved_count += 1
        
        print(f"[OK] 图片已清理: 移动 {moved_count} 个文件到 trash")
        
        return moved_count
    
    def sync(self, dry_run: bool = True):
        """
        执行同步操作
        
        Args:
            dry_run: 是否为预览模式（不实际执行）
        """
        print("\n[开始] 开始同步...")
        
        # 1. 扫描图片
        print("[扫描] 扫描图片目录...")
        image_asins, image_files = self.scan_images()
        print(f"  找到 {len(image_files)} 个图片文件，{len(image_asins)} 个唯一 ASIN")
        
        # 2. 扫描 CSV
        print("[扫描] 扫描 CSV 文件...")
        csv_asins, df = self.scan_csv()
        print(f"  找到 {len(df)} 条记录，{len(csv_asins)} 个唯一 ASIN")
        
        # 3. 计算交集
        print("[计算] 计算交集...")
        keep_asins, csv_only, image_only = self.calculate_intersection(csv_asins, image_asins)
        
        # 4. 预览更改
        self.preview_changes(keep_asins, csv_only, image_only, df, image_files)
        
        # 5. 如果是 dry-run，到此结束
        if dry_run:
            return
        
        # 6. 执行实际操作
        print("\n[执行] 执行同步操作...")
        
        # 备份 CSV
        self.backup_csv()
        
        # 清理 CSV
        deleted_rows = self.clean_csv(keep_asins, df)
        
        # 清理图片
        moved_images = self.clean_images(keep_asins, image_files)
        
        # 7. 最终报告
        print("\n" + "="*80)
        print("[完成] 同步完成!")
        print("="*80)
        print(f"\n[统计] 最终统计:")
        print(f"  保留的 ASIN: {len(keep_asins)}")
        print(f"  删除的 CSV 行: {deleted_rows}")
        print(f"  移动的图片: {moved_images}")
        print(f"  当前 CSV 行数: {len(keep_asins) + 1} (含标题)")
        print(f"  当前图片数量: {len(keep_asins)}")
        print(f"\n[备份] 备份位置: {self.trash_dir / self.image_dir.name}")
        print("="*80 + "\n")


def main():
    parser = argparse.ArgumentParser(
        description='同步 CSV 和图片文件，只保留两者都存在的 ASIN',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  # 预览模式（默认）
  python sync_csv_images.py
  
  # 执行实际操作
  python sync_csv_images.py --execute
  
  # 自定义路径
  python sync_csv_images.py --csv data/csv/custom.csv --images images/custom --execute
        """
    )
    
    parser.add_argument(
        '--csv',
        default='data/csv/1.19-500.csv',
        help='CSV 文件路径 (默认: data/csv/1.19-500.csv)'
    )
    
    parser.add_argument(
        '--images',
        default='images/1.19-500',
        help='图片目录路径 (默认: images/1.19-500)'
    )
    
    parser.add_argument(
        '--trash',
        default='trash',
        help='备份目录路径 (默认: trash)'
    )
    
    parser.add_argument(
        '--execute',
        action='store_true',
        help='执行实际操作（默认为 dry-run 预览模式）'
    )
    
    args = parser.parse_args()
    
    try:
        syncer = CSVImageSyncer(args.csv, args.images, args.trash)
        syncer.sync(dry_run=not args.execute)
    except Exception as e:
        print(f"\n[错误] {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
