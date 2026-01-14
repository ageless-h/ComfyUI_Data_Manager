# 测试文档

## 测试文件说明

### test_data_manager.py
主测试文件，使用 Playwright 进行 UI 自动化测试

### test_import.py
模块导入测试

### test_ui_button.py
UI 按钮功能测试

### test_widgets.py
Widget 组件测试

### test_ports_hidden.py
隐藏端口测试

### test_dom_widgets.py
DOM Widget 测试

## 测试截图

测试截图位于 `screenshots/` 目录，用于可视化测试验证：

- `01_initial_load.png`: 节点初始加载
- `02_search_results.png`: 搜索结果展示
- `03_final_state.png`: 最终状态
- `04_node_menu.png`: 节点菜单
- `05_node_added.png`: 节点添加后
- `06_before_ui_open.png`: UI 打开前
- `07_file_manager_open.png`: 文件管理器打开
- `10_node_added.png`: 节点添加（版本2）
- `20_node_with_button.png`: 带按钮的节点
- `21_file_manager_open.png`: 文件管理器打开（版本2）
- `nodes_final.png`: 节点最终状态
- `three_nodes.png`: 三个节点
- `widgets_check.png`: Widget 检查
- `debug_widgets.png`: 调试 Widget
- `dom_check.png`: DOM 检查
- `final_check.png`: 最终检查
- `debug_screenshot.png`: 调试截图
- `forceInput_test.png`: forceInput 测试

## 运行测试

```bash
# 运行所有测试
python test_data_manager.py

# 运行特定测试
python test_import.py
```
