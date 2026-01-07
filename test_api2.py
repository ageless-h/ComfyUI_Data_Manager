# -*- coding: utf-8 -*-
"""测试后端 API"""
import requests
import os

BASE_URL = "http://127.0.0.1:8188"

def test_preview_api():
    """测试预览 API"""
    test_dir = r"C:\Users\Administrator\Documents\ai\ComfyUI\custom_nodes\ComfyUI_Data_Manager"

    # 测试 txt 文件
    print("=" * 50)
    print("测试文本文件 API")
    print("=" * 50)

    txt_path = os.path.join(test_dir, "test.txt")
    if os.path.exists(txt_path):
        print(f"\n测试文件: {txt_path}")
        try:
            response = requests.get(f"{BASE_URL}/dm/preview", params={"path": txt_path})
            print(f"状态码: {response.status_code}")

            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                print(f"Content-Type: {content_type}")

                if 'text/plain' in content_type:
                    content = response.text
                    print(f"内容:\n{content}")
                    print("\n✅ 文本文件读取成功!")
                else:
                    print(f"响应: {response.text[:300]}")
            else:
                print(f"❌ 请求失败: {response.text[:200]}")

        except Exception as e:
            print(f"❌ 异常: {e}")

    # 测试 markdown 文件
    print("\n" + "=" * 50)
    print("测试 Markdown 渲染 API")
    print("=" * 50)

    # 创建一个临时 md 文件
    md_content = """# 测试 Markdown

## 二级标题

这是**粗体**和*斜体*文本。

### 代码块

```python
def hello():
    print("Hello World")
```

### 列表
- 项目1
- 项目2
"""

    md_path = os.path.join(test_dir, "test.md")
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(md_content)

    print(f"\n测试文件: {md_path}")
    try:
        response = requests.get(f"{BASE_URL}/dm/preview", params={"path": md_path})
        print(f"状态码: {response.status_code}")

        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            print(f"Content-Type: {content_type}")

            if 'text/html' in content_type:
                content = response.text
                if '<h1' in content or '<h2' in content:
                    print("✅ Markdown 渲染成功!")
                    print(f"HTML 预览:\n{content[:500]}...")
                else:
                    print("❌ Markdown 未正确渲染")
                    print(f"响应:\n{content[:500]}")
            else:
                print(f"响应:\n{response.text[:300]}")
        else:
            print(f"❌ 请求失败: {response.text[:200]}")

    except Exception as e:
        print(f"❌ 异常: {e}")

    # 清理测试文件
    if os.path.exists(md_path):
        os.remove(md_path)

if __name__ == "__main__":
    test_preview_api()
