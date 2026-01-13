#!/usr/bin/env python3
"""
Check specific plant data from the CSV.
"""

import csv
from pathlib import Path

def find_plant_in_plot(csv_path, plant_name, plot_number):
    """
    Find the count of a specific plant in a specific plot.
    
    Args:
        csv_path: Path to CSV file
        plant_name: Name of the plant (e.g., "Mango")
        plot_number: Plot number (e.g., 8)
    """
    csv_file = Path(csv_path)
    
    if not csv_file.exists():
        print(f"Error: File not found: {csv_path}")
        return None
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        rows = list(reader)
    
    if not rows or len(rows) < 2:
        print("CSV file is empty or invalid")
        return None
    
    # Get headers - plot numbers start from column index 2 (after "SF1" and "Plot No -->")
    headers = rows[0]
    
    # Find the column index for the plot number
    # Headers are: SF1, Plot No -->, 1, 2, 3, ..., 300
    # So plot N is at index N+1 (0-indexed: 0=SF1, 1=Plot No -->, 2=1, 3=2, ..., 9=8)
    plot_col_index = None
    for i, header in enumerate(headers):
        if str(header).strip() == str(plot_number):
            plot_col_index = i
            break
    
    if plot_col_index is None:
        print(f"Plot {plot_number} not found in headers")
        return None
    
    print(f"Plot {plot_number} is at column index {plot_col_index}")
    print(f"Column header: '{headers[plot_col_index]}'")
    
    # Find the row with the plant name
    plant_row = None
    plant_category = None
    
    for row in rows[2:]:  # Skip header row (0) and date row (1)
        if len(row) > 0:
            # Check if this row contains the plant name
            # Plant name is typically in column 1 (after category in column 0)
            if len(row) > 1 and plant_name.lower() in str(row[1]).lower():
                plant_row = row
                plant_category = row[0] if row[0] else "Unknown"
                break
    
    if plant_row is None:
        print(f"Plant '{plant_name}' not found in CSV")
        return None
    
    # Get the value at the plot column
    if plot_col_index < len(plant_row):
        value = plant_row[plot_col_index].strip()
        print(f"\nFound {plant_name} (Category: {plant_category})")
        print(f"Value in plot {plot_number}: '{value}'")
        
        # Convert to number if possible
        if value == '' or value == '0':
            count = 0
        else:
            try:
                count = int(value)
            except ValueError:
                count = value  # Return as string if not a number
        
        return {
            'plant': plant_name,
            'category': plant_category,
            'plot': plot_number,
            'count': count,
            'raw_value': value
        }
    else:
        print(f"Column index {plot_col_index} is out of range for this row")
        return None

if __name__ == '__main__':
    csv_path = '/Users/ack/Downloads/Plants Data-Softaware - SF1.csv'
    
    result = find_plant_in_plot(csv_path, "Mango", 8)
    
    if result:
        print(f"\n{'='*60}")
        print(f"Result: {result['count']} {result['plant']} plant(s) in plot {result['plot']}")
        print(f"{'='*60}")
    else:
        print("\nCould not find the data")


