#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import csv
import sys

def fix_csv(input_file, output_file):
    """
    读取CSV文件，将多行类目字段中的换行符替换为分号
    """
    with open(input_file, 'r', encoding='utf-8-sig', newline='') as infile:
        reader = csv.reader(infile)
        
        rows = []
        for row in reader:
            if len(row) > 0:
                # 处理小类目字段（第5列，索引为4），将换行符替换为分号
                if len(row) > 4:
                    row[4] = row[4].replace('\n', '; ').replace('\r', '')
                rows.append(row)
    
    # 写入新文件
    with open(output_file, 'w', encoding='utf-8-sig', newline='') as outfile:
        writer = csv.writer(outfile)
        writer.writerows(rows)
    
    print(f"Successfully processed {len(rows)} rows")
    print(f"Output saved to: {output_file}")

if __name__ == '__main__':
    input_file = '1.19-500.csv.backup'
    output_file = '1.19-500-cleaned.csv'
    
    try:
        fix_csv(input_file, output_file)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
