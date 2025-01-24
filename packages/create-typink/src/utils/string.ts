export const IS_VALID_PACKAGE_NAME = /^(?![._])(?!(http|stream|node_modules|favicon\.ico)$)[a-z0-9-]{1,214}$/;
export const IS_TEMPLATE_FILE = /([^/\\]*?)\.template\./;
export const IS_IGNORE_FILES = /[\\/]?(node_modules|dist|build|\.git|\.yarn)([\\/]|$)/;
