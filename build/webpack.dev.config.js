'use strict'
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin') // 生成html的插件
const webpack = require('webpack')
const baseConfig = require('./webpack.base')
const merge = require('webpack-merge')
const tools = require('./tools.js')

const devWebpackConfig = merge(baseConfig, {
    output: {
        publicPath: '/' // 模板、样式、脚本、图片等资源对应的server上的路径
    },
    devtool: 'eval-source-map', // 指定加source-map的方式
    devServer: {
        inline: true, //打包后加入一个websocket客户端
        hot: true, //热加载
        contentBase: path.join(__dirname, "..", "dist"), //静态文件根目录
        port: 3824, // 端口
        host: 'localhost',
        overlay: true,
        compress: false // 服务器返回浏览器的时候是否启动gzip压缩
    },
    watchOptions: {
        ignored: /node_modules/, //忽略不用监听变更的目录
        aggregateTimeout: 500, //防止重复保存频繁重新编译,500毫米内重复保存不打包
        poll: 1000 //每秒询问的文件变更的次数
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(), //HMR
        new webpack.NamedModulesPlugin() // HMR
    ]
})

const filesArray = tools.getStringFromCurrentDirectory(path.join(__dirname, '..', 'src/view'))
// 根据文件数组生成HtmlWebpackPlugin相关的集合
function createHtmlWebpackPluginList(filesArray) {
    let HtmlWebpackPluginList = []
    filesArray.forEach(file => {
        let tempPlugin = null
        let fileName = file.split('.')[0]
        tempPlugin = new HtmlWebpackPlugin({
            favicon: `src/img/favicon.ico`, //favicon路径，通过webpack引入同时可以生成hash值
            filename: `view/${fileName}.html`, //生成的html存放路径，相对于path
            template: `src/view/${file}`, //html模板路径
            hash: true, //为静态资源生成hash值
            chunks: ['common', fileName],//需要引入的chunk，不配置就会引入所有页面的资源
            minify: { //压缩HTML文件    
                removeAttributeQuotes:true//压缩 去掉引号
            }
        })
        HtmlWebpackPluginList.push(tempPlugin)
    })
    return HtmlWebpackPluginList
}
const HtmlWebpackPluginList = createHtmlWebpackPluginList(filesArray)
devWebpackConfig.plugins = devWebpackConfig.plugins.concat(HtmlWebpackPluginList)

module.exports = devWebpackConfig