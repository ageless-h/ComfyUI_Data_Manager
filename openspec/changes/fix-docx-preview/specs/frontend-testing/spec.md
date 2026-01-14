## ADDED Requirements

### Requirement: DOCX 预览 MUST 清理内部函数引用

DOCX 文件预览输出的 HTML MUST 不包含 mammoth.js 内部函数的字符串表示。

#### Scenario: 过滤函数字符串
- **GIVEN** mammoth.js 转换 DOCX 后的 HTML 输出
- **WHEN** 输出包含类似 `function(){return value.call(this._target())}` 的字符串
- **THEN** 必须在显示前过滤掉这些函数字符串
- **AND** 最终 HTML 不应包含任何 `function(){...}` 模式

#### Scenario: 保持有效内容
- **GIVEN** 包含有效内容的 DOCX 文件
- **WHEN** 清理函数引用后
- **THEN** 所有有效的文本、图片、表格内容必须保留
- **AND** HTML 结构必须保持完整

### Requirement: 预览错误 MUST 记录详细信息

预览失败时 MUST 记录足够的调试信息。

#### Scenario: 记录转换错误
- **GIVEN** DOCX 文件转换失败
- **WHEN** 错误发生时
- **THEN** 必须记录原始错误消息
- **AND** 必须记录文件路径
- **AND** 必须在用户界面显示友好的错误提示

#### Scenario: 记录清理警告
- **GIVEN** mammoth 输出包含需要清理的内容
- **WHEN** 清理函数被调用
- **THEN** 必须记录清理的内容类型
- **AND** 必须记录清理的数量
