# -*- coding: utf-8 -*-
"""测试文档预览功能"""

import subprocess
import time
import sys
import os

# 添加 skills 目录到路径
sys.path.insert(0, r"C:\Users\Administrator\.claude\skills\webapp-testing")

from playwright.sync_api import sync_playwright

def main():
    # 启动 ComfyUI
    print("🚀 启动 ComfyUI...")
    server_proc = subprocess.Popen(
        [r"C:\Users\Administrator\Documents\ai\ComfyUI\.venv\Scripts\python.exe", "main.py", "--dont-print-server"],
        cwd=r"C:\Users\Administrator\Documents\ai\ComfyUI",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    # 等待服务器启动
    print("⏳ 等待服务器启动...")
    time.sleep(15)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            # 捕获控制台消息
            console_messages = []
            page.on("console", lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))

            # 访问 ComfyUI
            print("🌐 访问 ComfyUI...")
            page.goto("http://127.0.0.1:8188", timeout=30000)
            page.wait_for_load_state("networkidle", timeout=30000)

            # 查找数据管理器按钮
            print("🔍 查找数据管理器按钮...")
            time.sleep(3)

            # 截图
            page.screenshot(path=r"C:\Users\Administrator\Documents\ai\ComfyUI\custom_nodes\ComfyUI_Data_Manager\test_screenshot.png", full_page=True)
            print("📸 截图已保存")

            # 打印控制台消息
            print("\n📋 控制台消息:")
            for msg in console_messages:
                print(msg)

            browser.close()
            print("✅ 测试完成")

    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # 停止服务器
        print("🛑 停止服务器...")
        server_proc.terminate()
        server_proc.wait(timeout=10)

if __name__ == "__main__":
    main()
