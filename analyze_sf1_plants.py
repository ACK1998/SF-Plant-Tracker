#!/usr/bin/env python3
"""
Analyze SF1 domain plant data:
- Count how many plots have plants
- Calculate total number of plants
"""

import csv
from pathlib import Path
from collections import defaultdict

def analyze_sf1_plants(csv_path):
    """
    Analyze plant data for SF1 domain.
    
    Args:
        csv_path: Path to CSV file
    """
    csv_file = Path(csv_path)
    
    if not csv_file.exists():
        print(f"Error: File not found: {csv_path}")
        return None
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        rows = list(reader)
    
    if not rows or len(rows) < 3:
        print("CSV file is empty or invalid")
        return None
    
    # Get headers - plot numbers start from column index 2 (after "SF1" and "Plot No -->")
    headers = rows[0]
    
    # Find plot columns (columns with numeric headers from 1 to 300)
    plot_columns = {}
    for i, header in enumerate(headers):
        header_str = str(header).strip()
        if header_str.isdigit():
            plot_num = int(header_str)
            plot_columns[plot_num] = i
    
    print(f"Found {len(plot_columns)} plot columns (1 to {max(plot_columns.keys())})")
    
    # Process plant data rows (skip header row 0 and date row 1)
    plant_data = []
    plots_with_plants = set()
    total_plants = 0
    plot_totals = defaultdict(int)  # Total plants per plot
    plant_totals = defaultdict(int)  # Total plants per plant type
    
    for row in rows[2:]:  # Skip header and date rows
        if len(row) < 2:
            continue
        
        category = row[0].strip() if row[0] else ""
        plant_name = row[1].strip() if len(row) > 1 and row[1] else ""
        
        if not plant_name:
            continue
        
        # Process each plot column
        for plot_num, col_index in plot_columns.items():
            if col_index < len(row):
                value = row[col_index].strip()
                
                # Treat empty, "0", or whitespace as no plants
                if value and value != '0' and value != '':
                    try:
                        count = int(value)
                        if count > 0:
                            plots_with_plants.add(plot_num)
                            total_plants += count
                            plot_totals[plot_num] += count
                            plant_totals[plant_name] += count
                            
                            plant_data.append({
                                'category': category,
                                'plant': plant_name,
                                'plot': plot_num,
                                'count': count
                            })
                    except ValueError:
                        # Not a number, skip
                        pass
    
    # Print results
    print("\n" + "="*70)
    print("SF1 DOMAIN PLANT ANALYSIS")
    print("="*70)
    
    print(f"\n📊 SUMMARY:")
    print(f"   Total plots with plants: {len(plots_with_plants)}")
    print(f"   Total plots in CSV: {len(plot_columns)}")
    print(f"   Empty plots: {len(plot_columns) - len(plots_with_plants)}")
    print(f"   Total number of plants: {total_plants}")
    
    print(f"\n📋 PLOTS WITH PLANTS:")
    plots_sorted = sorted(plots_with_plants)
    print(f"   Plot numbers: {', '.join(map(str, plots_sorted[:20]))}")
    if len(plots_sorted) > 20:
        print(f"   ... and {len(plots_sorted) - 20} more plots")
    
    print(f"\n🌳 TOP 10 PLANTS BY TOTAL COUNT:")
    sorted_plants = sorted(plant_totals.items(), key=lambda x: x[1], reverse=True)
    for i, (plant, count) in enumerate(sorted_plants[:10], 1):
        print(f"   {i:2d}. {plant:25s}: {count:4d} plants")
    
    print(f"\n📈 TOP 10 PLOTS BY PLANT COUNT:")
    sorted_plots = sorted(plot_totals.items(), key=lambda x: x[1], reverse=True)
    for i, (plot, count) in enumerate(sorted_plots[:10], 1):
        print(f"   {i:2d}. Plot {plot:3d}: {count:4d} plants")
    
    print("\n" + "="*70)
    
    return {
        'plots_with_plants': len(plots_with_plants),
        'total_plots': len(plot_columns),
        'total_plants': total_plants,
        'plot_totals': dict(plot_totals),
        'plant_totals': dict(plant_totals),
        'plots_list': sorted(plots_with_plants)
    }

if __name__ == '__main__':
    csv_path = '/Users/ack/Downloads/Plants Data-Softaware - SF1.csv'
    analyze_sf1_plants(csv_path)


