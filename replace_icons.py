import re

with open('src/components/SideNavBar.tsx', 'r') as f:
    content = f.read()

# Map of material symbol name to Lucide component
icon_map = {
    'photo_camera': 'Camera',
    'barcode_scanner': 'ScanBarcode',
    'monitoring': 'Activity',
    'precision_manufacturing': 'Factory',
    'point_of_sale': 'Calculator',
    'receipt_long': 'Receipt',
    'inventory_2': 'Boxes',
    'visibility': 'Eye',
    'hub': 'Waypoints',
    'local_shipping': 'Truck',
    'query_stats': 'PieChart',
    'assignment_return': 'RefreshCcw',
    'account_balance_wallet': 'WalletCards',
    'analytics': 'BarChart3',
    'badge': 'Users',
    'manage_accounts': 'ShieldCheck',
    'psychology': 'BrainCircuit',
    'auto_fix_high': 'Sparkles',
    'lock': 'Lock',
    'chevron_right': 'ChevronRight',
    'verified': 'BadgeCheck',
    'trending_up': 'TrendingUp',
    'medication': 'Pill' # For the older due collections? wait, it was changed to account_balance_wallet
}

used_icons = set()

def replace_match(match):
    full_str = match.group(0)
    classes = match.group(1)
    icon_name = match.group(2)
    
    # Remove material-symbols-outlined
    classes = classes.replace('material-symbols-outlined', '').strip()
    
    # Extract text-[SIZEpx]
    size = 18
    size_match = re.search(r'text-\[?(\d+)px\]?', classes)
    if size_match:
        size = int(size_match.group(1))
        classes = re.sub(r'text-\[?\d+px\]?', '', classes).strip()
    
    if icon_name in icon_map:
        lucide_icon = icon_map[icon_name]
        used_icons.add(lucide_icon)
        
        # Format class string properly
        # Clean up multiple spaces
        classes = re.sub(r'\s+', ' ', classes).strip()
        
        if classes:
            return f'<{lucide_icon} size={{{size}}} className="{classes}" />'
        else:
            return f'<{lucide_icon} size={{{size}}} />'
    return full_str

# Regex to find <span className="material-symbols-outlined ...">icon_name</span>
pattern = re.compile(r'<span[^>]*className="([^"]*material-symbols-outlined[^"]*)"[^>]*>([^<]+)</span>')

new_content = pattern.sub(replace_match, content)

# Also handle cases where there might be a title attribute or other attributes
# Actually, the lock icon has a title="Locked by RBAC"
def replace_match_with_title(match):
    full_str = match.group(0)
    classes = match.group(1)
    other_attrs = match.group(2)
    icon_name = match.group(3)
    
    classes = classes.replace('material-symbols-outlined', '').strip()
    
    size = 18
    size_match = re.search(r'text-\[?(\d+)px\]?', classes)
    if size_match:
        size = int(size_match.group(1))
        classes = re.sub(r'text-\[?\d+px\]?', '', classes).strip()
        
    if icon_name in icon_map:
        lucide_icon = icon_map[icon_name]
        used_icons.add(lucide_icon)
        classes = re.sub(r'\s+', ' ', classes).strip()
        
        attrs_str = ""
        if other_attrs:
            attrs_str = " " + other_attrs.strip()
            
        if classes:
            return f'<{lucide_icon} size={{{size}}} className="{classes}"{attrs_str} />'
        else:
            return f'<{lucide_icon} size={{{size}}}{attrs_str} />'
    return full_str

pattern_advanced = re.compile(r'<span\s+className="([^"]*material-symbols-outlined[^"]*)"([^>]*)>([^<]+)</span>')
new_content = pattern_advanced.sub(replace_match_with_title, content)

# Add imports
if used_icons:
    import_str = f"import {{ {', '.join(sorted(used_icons))} }} from 'lucide-react';\n"
    new_content = new_content.replace("import React from 'react';", "import React from 'react';\n" + import_str)

with open('src/components/SideNavBar.tsx', 'w') as f:
    f.write(new_content)

print(f"Replaced {len(used_icons)} unique icons")
