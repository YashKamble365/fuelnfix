import os
import glob

files = glob.glob('/Users/yashkamble/Documents/fuelnfix/client/src/**/*.jsx', recursive=True)

for file in files:
    with open(file, 'r') as f:
        content = f.read()

    changed = False

    # The block we added looks like this roughly:
    # <>
    # <img src="/logo1.png?v=3" alt="FuelNFix Logo" className="dark:hidden block h-16 md:h-20 w-auto" />
    # <img src="/logo_dark.png" alt="FuelNFix Logo" className="hidden dark:block h-16 md:h-20 w-auto" />
    # </>
    
    # We can split by lines and filter out the `<>`, `</>`, and `logo_dark.png` lines.
    # We also need to strip `"dark:hidden block "` or `"dark:hidden block"` from the classNames.
    # And change `logo1.png?v=3` to `logo1.png`
    
    if '/logo1.png' in content or '/logo_dark.png' in content:
        lines = content.split('\n')
        new_lines = []
        skip_next = False
        
        for i, line in enumerate(lines):
            if '<>' in line and i + 1 < len(lines) and '/logo1.png' in lines[i+1]:
                # Found the start of our block, skip adding the <>
                changed = True
                continue
            elif '/logo_dark.png' in line and 'hidden dark:block' in line:
                # Skip the dark mode logo
                changed = True
                continue
            elif '</>' in line and i - 1 >= 0 and '/logo_dark.png' in lines[i-1]:
                # Skip the closing tag of our block
                changed = True
                continue
            elif '/logo1.png' in line and ('dark:hidden block ' in line or 'dark:hidden block' in line):
                # Fix the light mode logo line
                new_line = line.replace('?v=3', '').replace('?v=2', '').replace('dark:hidden block ', '').replace('dark:hidden block', '')
                new_lines.append(new_line)
                changed = True
            else:
                new_lines.append(line)
                
        if changed:
            with open(file, 'w') as f:
                f.write('\n'.join(new_lines))
            print(f"Updated {file}")
