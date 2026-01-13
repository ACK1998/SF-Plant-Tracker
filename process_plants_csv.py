#!/usr/bin/env python3
"""
Process the Plants Data CSV file, treating 0 values as empty columns.
"""

import csv
import sys
from pathlib import Path

def process_csv(input_path, output_path=None):
    """
    Read CSV file and treat 0 values as empty columns.
    
    Args:
        input_path: Path to input CSV file
        output_path: Optional path to save processed CSV (if None, prints to stdout)
    """
    input_file = Path(input_path)
    
    if not input_file.exists():
        print(f"Error: File not found: {input_path}")
        return
    
    processed_rows = []
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        
        for row in reader:
            # Process each cell: convert "0" to empty string
            processed_row = [cell if cell != '0' else '' for cell in row]
            processed_rows.append(processed_row)
    
    # Output results
    if output_path:
        output_file = Path(output_path)
        with open(output_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerows(processed_rows)
        print(f"Processed CSV saved to: {output_path}")
        print(f"Total rows processed: {len(processed_rows)}")
    else:
        # Print to stdout
        writer = csv.writer(sys.stdout)
        writer.writerows(processed_rows)
    
    return processed_rows

def analyze_csv(input_path):
    """
    Analyze the CSV structure and provide summary.
    """
    input_file = Path(input_path)
    
    if not input_file.exists():
        print(f"Error: File not found: {input_path}")
        return
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        rows = list(reader)
    
    if not rows:
        print("CSV file is empty")
        return
    
    # Get headers
    headers = rows[0] if rows else []
    print(f"CSV Analysis:")
    print(f"  Total rows: {len(rows)}")
    print(f"  Total columns: {len(headers)}")
    print(f"  Headers: {headers[:5]}... (showing first 5)")
    
    # Count zeros
    zero_count = 0
    empty_count = 0
    data_count = 0
    
    for row in rows[1:]:  # Skip header row
        for cell in row:
            if cell == '0':
                zero_count += 1
            elif cell == '' or cell.strip() == '':
                empty_count += 1
            else:
                data_count += 1
    
    print(f"\nCell Statistics:")
    print(f"  Cells with value '0': {zero_count}")
    print(f"  Empty cells: {empty_count}")
    print(f"  Cells with data: {data_count}")
    
    # Show plant categories
    print(f"\nPlant Categories found:")
    categories = set()
    for row in rows[2:]:  # Skip header and date rows
        if row and row[0]:
            categories.add(row[0])
    for cat in sorted(categories):
        print(f"  - {cat}")

if __name__ == '__main__':
    csv_path = '/Users/ack/Downloads/Plants Data-Softaware - SF1.csv'
    
    # Analyze first
    print("=" * 60)
    analyze_csv(csv_path)
    print("=" * 60)
    
    # Process and save
    output_path = '/Users/ack/Documents/SF/sanctity-ferme-plant-tracker/processed_plants_data.csv'
    print(f"\nProcessing CSV (treating 0 as empty)...")
    process_csv(csv_path, output_path)
    print("=" * 60)


