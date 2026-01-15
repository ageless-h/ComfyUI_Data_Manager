# Change: 批量文件处理模式

## Why

当前 ComfyUI_Data_Manager 的 InputPathConfig 和 OutputPathConfig 节点只支持单文件处理。当用户需要：

1. **处理多个输入文件**时，必须创建多个节点并手动连线
2. **批量处理文件**时，必须复制工作流或手动修改参数
3. **保存多个输出**时，必须创建多个节点

根据对 ComfyUI 生态系统的深入分析（见 `doc/分析.md`），ComfyUI 支持**序列列表处理**机制：
- 节点返回列表时，下游节点会对**每个元素自动执行一次**
- 每次执行只处理一个元素
- **不会内存堆积**

本提案将利用这一机制，为现有的 InputPathConfig 和 OutputPathConfig 节点添加批量处理能力。

## What Changes

### 核心设计原则

- **扩展现有节点**：不创建新节点，在现有节点上添加模式
- **路径列表输出**：返回文件路径列表，而非加载后的数据
- **利用自动迭代**：让 ComfyUI 引擎处理迭代逻辑
- **保持架构一致**：Core → Input/Output 的关系不变

### InputPathConfig 节点扩展

**新增功能**：批量保存模式

**新增输入**：
```python
inputs=[
    # ... 现有输入 ...
    io.Boolean.Input("enable_batch"),    # 新增：启用批量模式
    io.String.Input("naming_rule"),      # 新增：命名规则（如 "result_{:04d}"）
]
```

**行为**：
- 当 `enable_batch = False`：单文件模式（现有行为）
- 当 `enable_batch = True`：批量模式
  - 接收迭代的数据（由上游列表触发）
  - 根据 `naming_rule` 自动命名
  - 逐个保存文件

### OutputPathConfig 节点扩展

**新增功能**：Match 模式（通配符加载）

**新增输入**：
```python
inputs=[
    # ... 现有输入 ...
    io.Boolean.Input("enable_match"),    # 新增：启用 match 模式
    io.String.Input("pattern"),          # 新增：glob 模式（如 "*.png", "**/*.jpg"）
]
```

**行为**：
- 当 `enable_match = False`：单文件模式（现有行为）
- 当 `enable_match = True`：Match 模式
  - 使用 Python `glob` 模式匹配文件
  - 返回**文件路径字符串列表**（非加载后的数据）
  - 下游节点自动对每个路径执行一次

### 内存安全保障

**关键设计决策**：
- OutputPathConfig 返回**文件路径列表**，非 IMAGE/VIDEO 列表
- 不设置 `INPUT_IS_LIST = True`
- 利用 ComfyUI 的**自动迭代机制**
- 每次只处理一个文件，**不会内存堆积**

### 通配符语法

支持 Python `glob` 模式：
- `*.png` - 当前目录的 PNG 文件
- `**/*.png` - 递归所有子目录的 PNG 文件
- `frame_*.jpg` - 匹配特定前缀
- `input/*.png` - 指定目录

### 工作流示例

#### 场景一：批量加载 + 自动迭代

```
┌─────────────────────────┐
│  OutputPathConfig        │
│  enable_match: true     │
│  pattern: input/*.png    │
└─────────────────────────┘
         ↓ (返回: ["path1.png", "path2.png", ...])
    [ComfyUI 自动迭代]
         ↓
┌─────────────────────────┐
│  你的处理工作流（单文件）  │
│  (会自动执行 N 次)        │
└─────────────────────────┘
         ↓
┌─────────────────────────┐
│  InputPathConfig         │
│  enable_batch: true      │
│  naming_rule: "result_{}"│
└─────────────────────────┘
```

#### 场景二：与现有 Core 节点配合

```
┌──────────────────┐
│ DataManagerCore  │
│  (UI 触发)       │
└──────────────────┘
         ↓
┌─────────────────────────┐
│  OutputPathConfig        │
│  (从 Core 获取配置)      │
└─────────────────────────┘
```

## Impact

- **影响的 specs**: `frontend-testing`, `backend-structure`
- **影响的代码**:
  - `backend/core/nodes_v3.py` - 扩展 InputPathConfig 和 OutputPathConfig
  - `backend/helpers/batch_scanner.py` - 新增：glob 文件扫描
  - `backend/helpers/batch_namer.py` - 新增：批量命名逻辑
  - `frontend/src/ui/components/` - 批量配置 UI
- **BREAKING**: 无（扩展功能，向后兼容）
