# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of @qvlt/core-logger
- Universal structured logging for browser and Node.js environments
- Transport-based architecture with Console, HTTP, and Stdout transports
- Component-based logging with child loggers
- Performance timing utilities
- Global logger instance management
- Environment-aware configuration (development vs production)
- Comprehensive test suite with Vitest
- TypeScript support with full type definitions
- Example project demonstrating usage patterns

### Features
- **ConsoleTransport**: Pretty-prints logs for development
- **HttpTransport**: Sends logs to HTTP endpoints with browser/Node.js support
- **StdoutTransport**: JSONL output for containerized environments
- **Multiple transport support**: Use multiple transports simultaneously
- **Custom transport interface**: Create your own transport implementations
- **Sampling**: Control log volume with configurable sampling rates
- **Batched transport**: Efficient delivery with configurable batch sizes
- **Session tracking**: Request correlation and context management

## [0.0.1] - 2024-09-10

### Added
- Initial release
- Core logging functionality
- Transport system
- Example project
- Comprehensive documentation
- GitHub Actions CI/CD
- Governance files and issue templates
