# -*- coding: utf-8 -*-
"""运行 SSH 测试

独立的测试脚本，避免触发父包导入
"""

import sys
import os
from pathlib import Path

# 确保当前目录在路径中
tests_dir = Path(__file__).parent
sys.path.insert(0, str(tests_dir))
sys.path.insert(0, str(tests_dir.parent))

# 设置环境变量避免导入问题
os.environ["PYTHONDONTWRITEBYTECODE"] = "1"

import pytest

# 运行测试
if __name__ == "__main__":
    sys.exit(
        pytest.main(
            [
                "-v",
                "--tb=short",
                "test_ssh_fs.py",
                "test_ssh_routes.py",
            ]
        )
    )
