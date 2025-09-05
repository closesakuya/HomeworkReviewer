// 文件路径: api/file.js

const fileService = uniCloud.importObject('file-service');

/**
 * 获取文件的临时访问URL
 * @param {object} params - { submissionId, fileId }
 */
export const registerTemporaryFileApi  = (params) => fileService.registerTemporaryFile(params);