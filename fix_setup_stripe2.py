import re

with open('src/pages/ShopSetup.tsx', 'r') as f:
    content = f.read()

start_str = '{/* Shop Owner\'s Bank Account Connection Guide */}'
end_str = '<button \n            type="submit" '

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + content[end_idx:]
    with open('src/pages/ShopSetup.tsx', 'w') as f:
        f.write(new_content)
    print("Removed Bank Guide")
else:
    print(f"Could not find start or end index. start={start_idx}, end={end_idx}")

