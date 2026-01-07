# -*- coding: utf-8 -*-
"""测试 markdown 渲染"""
import markdown
print('✅ markdown 版本:', markdown.__version__)

md = markdown.Markdown('## 测试标题\n- 列表项\n```python\nprint(1)\n```')
result = md.convert('## 测试\nHello **world**')
print('✅ 渲染结果:', result)
