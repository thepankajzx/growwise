import json
import re

with open('C:/Users/user/Downloads/ATOMIC/atomic-habits-free-4 concepts-v3.md', 'r', encoding='utf-8') as f:
    free_content = f.read()
    
with open('C:/Users/user/Downloads/ATOMIC/the-habit-stress-test- PREMIUM.md', 'r', encoding='utf-8') as f:
    premium_content = f.read()

# Parse free concepts
free_parts = re.split(r'## Concept \d+: ', free_content)[1:]
free_concepts = []
for part in free_parts:
    lines = part.split('\n', 1)
    title = lines[0].strip()
    markdown = lines[1].strip() if len(lines) > 1 else ''
    free_concepts.append({
        'title': title,
        'markdown': markdown,
        'isPremium': False
    })

# Parse premium
lines = premium_content.split('\n', 1)
premium_title = lines[0].replace('# ', '').strip()
premium_markdown = lines[1].strip() if len(lines) > 1 else ''
premium_concept = {
    'title': premium_title,
    'markdown': premium_markdown,
    'isPremium': True
}

all_concepts = free_concepts + [premium_concept]

with open('data.js', 'r', encoding='utf-8') as f:
    data_js = f.read()

# Very naive replacement of the concepts array inside atomic habits
import textwrap
concepts_str = json.dumps(all_concepts, indent=4)
indented_concepts = textwrap.indent(concepts_str, '                        ')

# We'll use regex to replace the concepts array
new_data_js = re.sub(
    r'concepts:\s*\[.*?\]\n\s*\}\n\s*\]\n\s*\}\n\];', 
    f'concepts: {indented_concepts.strip()}\n            }}\n        ]\n    }}\n];', 
    data_js, 
    flags=re.DOTALL
)

with open('data.js', 'w', encoding='utf-8') as f:
    f.write(new_data_js)

print("Updated data.js")
