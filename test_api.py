# -*- coding: utf-8 -*-
"""测试后端 API"""
import requests
import json

BASE_URL = "http://127.0.0.1:8188"

def test_preview_api():
    """测试预览 API"""

    # 测试 markdown 渲染
    print("=" * 50)
    print("测试 Markdown 渲染 API")
    print("=" * 50)

    # 查找一个 md 文件来测试
    test_paths = [
        r"C:\Users\Administrator\Documents\ai\ComfyUI\output\README.md",
        r"C:\Users\Administrator\Documents\ai\ComfyUI\output\history.md",
    ]

    for path in test_paths:
        import os
        if os.path.exists(path):
            print(f"\n📄 测试文件: {path}")
            try:
                response = requests.get(f"{BASE_URL}/dm/preview", params={"path": path})
                print(f"状态码: {response.status_code}")

                if response.status_code == 200:
                    content_type = response.headers.get('content-type', '')
                    print(f"Content-Type: {content_type}")

                    if 'text/html' in content_type:
                        content = response.text[:500]
                        print(f"内容预览 (前500字符): {content[:200]}...")
                        print("✅ Markdown 渲染成功!")
                    elif 'application/json' in content_type:
                        data = response.json()
                        print(f"错误响应: {data}")
                        print("❌ Markdown 渲染失败")
                else:
                    print(f"❌ 请求失败: {response.text[:200]}")

            except Exception as e:
                print(f"❌ 异常: {e}")
            break
    else:
        print("未找到测试用的 md 文件")

    # 测试 txt 文件
    print("\n" + "=" * 50)
    print("测试文本文件 API")
    print("=" * 50)

    txt_paths = [
        r"C:\Users\Administrator\Documents\ai\ComfyUI\output\prompt.txt",
    ]

    for path in txt_paths:
        import os
        if os.path.exists(path):
            print(f"\n📄 测试文件: {path}")
            try:
                response = requests.get(f"{BASE_URL}/dm/preview", params={"path": path})
                print(f"状态码: {response.status_code}")

                if response.status_code == 200:
                    content_type = response.headers.get('content-type', '')
                    print(f"Content-Type: {content_type}")

                    if 'text/plain' in content_type:
                        content = response.text[:500]
                        print(f"内容预览: {content[:200]}...")
                        print("✅ 文本文件读取成功!")
                    else:
                        print(f"响应: {response.text[:200]}")
                else:
                    print(f"❌ 请求失败: {response.text[:200]}")

            except Exception as e:
                print(f"❌ 异常: {e}")
            break
    else:
        print("未找到测试用的 txt 文件")

    # 测试 categories API
    print("\n" + "=" * 50)
    print("测试 Categories API")
    print("=" * 50)

    try:
        response = requests.get(f"{BASE_URL}/dm/categories")
        print(f"状态码: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print("✅ Categories API 正常")
            print(f"文档扩展名: {data['categories']['document']['extensions']}")
        else:
            print(f"❌ 请求失败: {response.text}")

    except Exception as e:
        print(f"❌ 异常: {e}")

if __name__ == "__main__":
    test_preview_api()
