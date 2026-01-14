# Testing Guide

This document describes how to run and write tests for ComfyUI Data Manager.

## Table of Contents

- [Frontend Testing](#frontend-testing)
  - [Running Tests](#running-tests)
  - [Test Organization](#test-organization)
  - [Writing Tests](#writing-tests)
  - [Best Practices](#best-practices)
- [Backend Testing](#backend-testing)
  - [Running Python Tests](#running-python-tests)
  - [SSH Testing](#ssh-testing)
  - [Backend Test Organization](#backend-test-organization)
- [Coverage Requirements](#coverage-requirements)
- [Troubleshooting](#troubleshooting)
- [CI/CD](#cicd)

---

## Frontend Testing

### Running Tests

### Run All Tests

```bash
cd frontend
npm run test
```

### Run Tests Once

```bash
npm run test:ci
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

Tests will automatically re-run when files change.

### Run Tests with UI

```bash
npm run test:ui
```

Opens Vitest UI at `http://localhost:51204/__vitest__/` for interactive debugging.

### Generate Coverage Report

```bash
npm run test:coverage
```

Generates an HTML coverage report in `frontend/coverage/index.html`.

## Test Organization

Tests are co-located with source files using the `*.test.ts` naming convention:

```
frontend/src/
├── api/
│   └── endpoints/
│       └── file.test.ts          # API endpoint tests
├── core/
│   └── state.test.ts              # State management tests
├── ui/
│   ├── components/
│   │   ├── preview.test.ts        # Component tests
│   │   └── format-selector.test.ts
│   └── floating/
│       └── window.test.ts         # Floating window tests
├── utils/
│   ├── format.test.ts             # Utility function tests
│   ├── file-type.test.ts
│   ├── drag.test.ts
│   └── csv.test.ts
└── tests/
    ├── setup.ts                   # Global test setup
    └── example.test.ts            # Example tests
```

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should do something specific', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = someFunction(input);

    // Assert
    expect(result).toBe('expected output');
  });
});
```

### Testing Async Functions

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected');
});
```

### Mocking External Dependencies

```typescript
import { vi } from 'vitest';

// Mock a module
vi.mock('./some-module.js', () => ({
  someFunction: vi.fn(() => 'mocked value')
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;
```

### Testing DOM Interactions

```typescript
it('should update DOM on click', () => {
  const button = document.createElement('button');
  button.textContent = 'Click me';

  button.click();

  expect(button.textContent).toBe('Clicked!');
});
```

### Testing Event Handlers

```typescript
it('should call callback on event', () => {
  const callback = vi.fn();
  const element = document.createElement('div');

  element.addEventListener('click', callback);
  element.dispatchEvent(new Event('click'));

  expect(callback).toHaveBeenCalled();
});
```

## Best Practices

1. **Describe Tests Clearly**: Use descriptive test names that explain what is being tested
2. **Arrange-Act-Assert**: Organize tests into setup, execution, and verification phases
3. **Test Isolation**: Each test should be independent and not rely on other tests
4. **Mock External Dependencies**: Use mocks to isolate code from external services
5. **Test Edge Cases**: Include tests for boundary conditions and error cases
6. **Keep Tests Simple**: Focus on testing one thing per test
7. **Use beforeEach**: Reset state between tests to avoid interference

## Coverage Requirements

The project maintains a minimum code coverage of 70% for:
- Lines
- Functions
- Branches
- Statements

Coverage reports are generated automatically in CI/CD.

## Troubleshooting

### Tests Failing in CI But Passing Locally

- Check Node.js version compatibility
- Verify all dependencies are installed: `npm ci`
- Clear local cache: `rm -rf node_modules package-lock.json && npm install`

### Mock Not Working

- Ensure mocks are defined before importing the module under test
- Use `vi.clearAllMocks()` in `beforeEach` to reset mocks between tests

### DOM Issues in Tests

- Use happy-dom for DOM interactions (already configured)
- Always clean up DOM in `beforeEach`: `document.body.innerHTML = ''`

### Import Path Issues

- Use `.js` extensions for imports: `import { foo } from './bar.js'`
- Verify `tsconfig.json` path aliases are correct

---

## Backend Testing

### Running Python Tests

#### Install Test Dependencies

```bash
pip install pytest pytest-asyncio pytest-cov
```

#### Run All Tests

```bash
# From project root
pytest tests/
```

#### Run Specific Test File

```bash
pytest tests/test_ssh_fs.py
```

#### Run Tests with Coverage

```bash
pytest tests/ --cov=utils --cov=api --cov-report=html --cov-report=term
```

Coverage report will be generated in `htmlcov/index.html`.

#### Run Tests in Verbose Mode

```bash
pytest tests/ -v
```

#### Run Specific Test Class

```bash
pytest tests/test_ssh_fs.py::TestConnect
```

#### Run Specific Test Method

```bash
pytest tests/test_ssh_fs.py::TestConnect::test_connect_success_with_password
```

### SSH Testing

SSH tests use a comprehensive mock strategy to avoid requiring real SSH connections during development.

#### Mock Strategy

SSH tests use `unittest.mock.Mock` to simulate SSH/SFTP operations:

- **SSH Client Mock**: Simulates paramiko.SSHClient with connection, command execution
- **SFTP Client Mock**: Simulates file operations (list, download, upload, delete)
- **Exception Mocks**: Simulates authentication and connection failures

This allows tests to run fast and reliably without network dependencies.

#### Test Fixtures

Shared fixtures are defined in `tests/conftest.py`:

```python
@pytest.fixture
def ssh_test_config():
    """SSH 测试服务器配置 - 从环境变量读取"""
    return {
        "host": os.getenv("SSH_TEST_HOST", "127.0.0.1"),
        "port": int(os.getenv("SSH_TEST_PORT", "22")),
        "username": os.getenv("SSH_TEST_USER", "test_user"),
        "password": os.getenv("SSH_TEST_PASSWORD", ""),
        "test_enabled": bool(os.getenv("SSH_TEST_PASSWORD")),
    }
```

#### Running Integration Tests (Real SSH Server)

Optional integration tests can run against a real SSH server for end-to-end validation:

```bash
# Set environment variables for real SSH server
export SSH_TEST_HOST=wp08.unicorn.org.cn
export SSH_TEST_PORT=19269
export SSH_TEST_USER=pzXtQg
export SSH_TEST_PASSWORD=voIXAEVYjn

# Run tests with real server
pytest tests/test_ssh_fs.py -v -k "integration"
```

**Warning**: Integration tests require real credentials and will make actual SSH connections. Only run these against test servers you control.

#### Mock Helper Functions

The `tests/fixtures/ssh_mock.py` module provides helper functions:

```python
from tests.fixtures.ssh_mock import (
    create_mock_ssh_client,
    create_mock_sftp_client,
    mock_auth_error,
    mock_connection_error,
)

# Create mock SSH client
mock_ssh = create_mock_ssh_client(
    host="test.example.com",
    port=22,
    username="testuser",
    connected=True
)

# Simulate authentication error
auth_error = mock_auth_error()
```

#### SSH Test Coverage

SSH module tests maintain minimum 80% coverage for:

- `utils/ssh_fs.py` - Core SSH/SFTP operations
- `api/routes/ssh.py` - SSH API endpoints
- `frontend/src/api/ssh.ts` - Frontend SSH client

#### Example SSH Test

```python
import pytest
from unittest.mock import Mock, patch

class TestConnect:
    def test_connect_success(self, monkeypatch, mock_ssh_client, mock_sftp_client):
        """使用密码连接成功"""
        mock_paramiko = Mock()
        mock_paramiko.SSHClient = Mock(return_value=mock_ssh_client)
        monkeypatch.setattr("utils.ssh_fs.paramiko", mock_paramiko)

        from utils.ssh_fs import connect

        conn_id, root_path = connect(
            host="test.example.com",
            port=22,
            username="testuser",
            password="testpass"
        )

        assert conn_id is not None
        assert root_path == "/home/testuser"
```

### Backend Test Organization

```
tests/
├── conftest.py                   # Shared pytest fixtures
├── fixtures/
│   └── ssh_mock.py              # SSH mock helper functions
├── test_ssh_fs.py               # SSH file system tests
└── test_ssh_routes.py           # SSH API route tests
```

---

## Coverage Requirements

### Frontend Coverage

The project maintains minimum code coverage for frontend:

| Metric   | Threshold | Current |
|----------|-----------|---------|
| Lines    | 70%       | ~52%    |
| Functions| 38%       | ~38%    |
| Branches | 70%       | ~45%    |
| Statements| 70%      | ~52%    |

Run frontend coverage report:

```bash
cd frontend
npm run test:coverage
```

### Backend Coverage

SSH modules maintain minimum 80% code coverage:

- `utils/ssh_fs.py` - SSH file system operations
- `api/routes/ssh.py` - SSH API endpoints

Run backend coverage report:

```bash
pytest tests/ --cov=utils.ssh_fs --cov=api.routes.ssh --cov-report=html
```

---

## Troubleshooting

### Python Test Issues

#### Module Not Found

```bash
# Ensure project root is in Python path
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Or run with -m pytest
python -m pytest tests/
```

#### SSH Tests Failing

- SSH tests use mocks by default and should not require real connections
- If integration tests fail, verify environment variables are set correctly
- Check that paramiko is installed: `pip install paramiko`

#### Async Test Issues

Ensure tests are marked with `@pytest.mark.asyncio`:

```python
@pytest.mark.asyncio
async def test_async_function():
    result = await async_operation()
    assert result is not None
```

---

## CI/CD

Tests run automatically on:
- Pull requests to `main` or `master` branches
- Pushes to `main` or `master` branches

The CI pipeline:
1. Checks out code
2. Sets up Node.js (v18 and v20) for frontend tests
3. Sets up Python for backend tests
4. Installs dependencies (npm and pip)
5. Runs frontend tests with Vitest
6. Runs backend tests with Pytest
7. Generates coverage reports
8. Checks coverage thresholds (70% frontend, 80% SSH modules)
9. Uploads coverage artifacts

## Additional Resources

### Frontend Testing
- [Vitest Documentation](https://vitest.dev/)
- [Happy DOM Documentation](https://github.com/capricorn86/happy-dom)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

### Backend Testing
- [Pytest Documentation](https://docs.pytest.org/)
- [pytest-asyncio Documentation](https://pytest-asyncio.readthedocs.io/)
- [Pytest Cov Documentation](https://pytest-cov.readthedocs.io/)
