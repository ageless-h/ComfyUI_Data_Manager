# -*- coding: utf-8 -*-
"""创建测试图像"""

from PIL import Image
import numpy as np
import os

# 创建一个简单的测试图像
img_array = np.random.randint(0, 255, (512, 512, 3), dtype=np.uint8)
img = Image.fromarray(img_array, "RGB")

# 保存到 ComfyUI input 目录
comfyui_input = r"C:\Users\Administrator\Documents\ai\ComfyUI\input"
os.makedirs(comfyui_input, exist_ok=True)

test_image_path = os.path.join(comfyui_input, "test_save_image.png")
img.save(test_image_path)

print(f"测试图像已创建: {test_image_path}")
print(f"图像大小: {img.size}")
