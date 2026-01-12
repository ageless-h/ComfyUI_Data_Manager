# API 文档

## 端点列表

### POST /dm/list
列出目录文件

**请求**:
```json
{
  "path": "./output",
  "recursive": false,
  "filter": "*.png"
}
```

**响应**:
```json
{
  "success": true,
  "path": "/absolute/path/to/output",
  "files": [...],
  "count": 42
}
```

### POST /dm/info
获取文件详细信息

**请求**:
```json
{
  "path": "./output/image.png"
}
```

**响应**:
```json
{
  "success": true,
  "info": {
    "name": "image.png",
    "path": "/absolute/path/to/image.png",
    "size": 1024000,
    "size_human": "1.0 MB",
    "extension": ".png",
    "modified": "2026-01-07T12:00:00",
    "created": "2026-01-07T12:00:00",
    "is_dir": false,
    "exists": true
  }
}
```

### POST /dm/save
保存文件

**请求**:
```json
{
  "source": "./temp/upload.png",
  "target_dir": "./output",
  "filename": "saved.png",
  "prefix": "",
  "add_timestamp": false
}
```

**响应**:
```json
{
  "success": true,
  "path": "/absolute/path/to/output/saved.png",
  "filename": "saved.png"
}
```

### GET /dm/categories
获取文件类别列表

**响应**:
```json
{
  "success": true,
  "categories": {
    "image": {
      "extensions": [".jpg", ".jpeg", ".png", ...],
      "icon": "pi-image",
      "color": "#e74c3c"
    },
    "video": {...},
    "audio": {...},
    "document": {...},
    "code": {...}
  }
}
```

### GET /dm/preview
预览文件内容

**请求**:
```
GET /dm/preview?path=./output/script.py
```

**响应**: 文件内容（文本格式）或错误信息
