const fs = require('fs')

// 根据文件夹的路径获取其中的文件字符串
function getStringFromCurrentDirectory(path) {
    let fileArray = []
    fileArray = fs.readdirSync(path)
    return fileArray
}

module.exports = {
    getStringFromCurrentDirectory
}