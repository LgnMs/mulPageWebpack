'use strict'
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin') // 复制静态资源的插件
const CleanWebpackPlugin = require('clean-webpack-plugin') // 清空打包目录的插件
const HtmlWebpackPlugin = require('html-webpack-plugin') // 生成html的插件
const webpack = require('webpack')
const baseConfig = require('./webpack.base')
const merge = require('webpack-merge')

const glob = require('glob')
const PurifyCSSPlugin = require('purifycss-webpack')
const WebpackParallelUglifyPlugin = require('webpack-parallel-uglify-plugin')
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
const tools = require('./tools.js')

const webpackConfig = merge(baseConfig, {
    output:{
        publicPath: './' //这里要放的是静态资源CDN的地址(只在生产环境下配置)
    },
    plugins: [
        new CopyWebpackPlugin([
            {
                from: path.join(__dirname, '..', 'src/img'),
                to: path.join(__dirname, '..', 'dist/img'),
                ignore: ['.*']
            }
        ]),
        new CleanWebpackPlugin(['dist'], {
            root: path.join(__dirname, '..'),
            verbose: true,
            dry:  false
        }),
        new OptimizeCSSPlugin({
            cssProcessorOptions: {safe: true}
        }),
        new PurifyCSSPlugin({
            paths: glob.sync(path.join(__dirname, '../src/*.html'))
        }),
        new WebpackParallelUglifyPlugin({
            uglifyJS: {
                output: {
                    beautify: false, //不需要格式化
                    comments: false //不保留注释
                },
                compress: {
                    warnings: false, // 在UglifyJs删除没有用到的代码时不输出警告
                    drop_console: true, // 删除所有的 `console` 语句，可以兼容ie浏览器
                    collapse_vars: true, // 内嵌定义了但是只用到一次的变量
                    reduce_vars: true // 提取出出现多次但是没有定义成变量去引用的静态值
                }
            }
        }),
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
            filename: `view/${fileName}.html`, //生成的html存放路径，相对于path
            template: `src/view/${file}`, //html模板路径
            hash: true, //为静态资源生成hash值
            chunks: ['common', fileName],//需要引入的chunk，不配置就会引入所有页面的资源
            minify: false
        })
        HtmlWebpackPluginList.push(tempPlugin)
    })
    return HtmlWebpackPluginList
}
const HtmlWebpackPluginList = createHtmlWebpackPluginList(filesArray)
webpackConfig.plugins = webpackConfig.plugins.concat(HtmlWebpackPluginList)

module.exports = webpackConfig