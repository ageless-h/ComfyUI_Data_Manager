/**
 * core-constants.js - 常量配置
 */

// 文件类型配置
export const FILE_TYPES = {
    image: {
        exts: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.tif', '.avif', '.heic', '.heif', '.tga'],
        icon: 'pi-image',
        color: '#e74c3c'
    },
    video: {
        exts: ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv'],
        icon: 'pi-video',
        color: '#9b59b6'
    },
    audio: {
        exts: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a'],
        icon: 'pi-volume-up',
        color: '#3498db'
    },
    document: {
        exts: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.md'],
        icon: 'pi-file',
        color: '#95a5a6'
    },
    spreadsheet: {
        exts: ['.xls', '.xlsx', '.csv', '.ods'],
        icon: 'pi-table',
        color: '#27ae60'
    },
    archive: {
        exts: ['.zip', '.rar', '.7z', '.tar', '.gz'],
        icon: 'pi-box',
        color: '#f39c12'
    },
    code: {
        exts: ['.py', '.js', '.html', '.css', '.json', '.xml', '.yaml', '.yml', '.cpp', '.c', '.h'],
        icon: 'pi-code',
        color: '#1abc9c'
    },
    folder: {
        icon: 'pi-folder',
        color: '#f1c40f'
    },
    unknown: {
        icon: 'pi-file',
        color: '#7f8c8d'
    }
};
