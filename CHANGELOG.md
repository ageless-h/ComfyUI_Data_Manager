# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 文件预览功能（图像、视频、音频、代码）
- 通配符文件搜索
- 列表/网格视图切换

### Changed
- 重构 API 路由结构（拆分为多个模块）
- 优化目录结构（core/utils 分层）
- 重命名测试截图目录（tests/screenshots/）

### Fixed
- 修复路径规范化问题
- 修复大文件上传失败
- 修复 V3 API 兼容性

### Removed
- 移除冗余的 data_manager.py
- 移除空文件 nul

## [1.0.0] - 2026-01-07

### Added
- 初始版本发布
- 支持 V1/V3 API
- 文件管理 UI
- 三个核心节点（Core, Input Path, Output Path）
- HTTP API 端点
- 完整的测试套件

### Architecture
- 双 API 支持（V1 Node 1.0 + V3 Node 2.0）
- 前后端分离架构
- 共享逻辑层（utils/）
- RESTful API 设计
