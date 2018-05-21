const path = require('path');
const webpack = require('webpack');
const glob = require('glob')
const chalk = require('chalk')
// HappyPack的多进程打包处理
const HappyPack = require('happypack')
const os = require('os') //获取电脑的处理器有几个核心，作为配置传入
// // extract-text-webpack-plugin插件，
// // 有了它就可以将你的样式提取到单独的css文件里，
// // 妈妈再也不用担心样式会被打包到js文件里了。
// const ExtractTextWebapckPlugin  = require('extract-text-webpack-plugin');
// html-webpack-plugin插件，重中之重，webpack中生成HTML的插件，
// 具体可以去这里查看https://www.npmjs.com/package/html-webpack-plugin
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin') // 清空打包目录的插件
const CopyWebpackPlugin = require('copy-webpack-plugin') // 复制静态资源的插件
// 用于css的tree-shaking
const PurifyCSSPlugin = require('purifycss-webpack')
// 用于js的tree-shaking
const WebpackParallelUglifyPlugin = require('webpack-parallel-uglify-plugin')
const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length })
//用于显示打包时间和进程
const ProgressBarPlugin = require('progress-bar-webpack-plugin')
 //CSS文件单独提取出来
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
// 压缩css代码
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')

function resolve (dir) {
    return path.join(__dirname, '..', dir)
}
function assetsPath(_path) {
    const assetsSubDirectory = path.join(__dirname, '..', 'src')

    return path.posix.join(assetsSubDirectory, _path)
}
module.exports = {
    entry: { //配置入口文件，有几个写几个
        index: './src/js/page/index.js',
        list: './src/js/page/list.js',
        about: './src/js/page/about.js',
    },
    output: {
        path: path.join(__dirname, '..', 'dist'), //输出目录的配置，模板、样式、脚本、图片等资源的路径配置都相对于它
        publicPath: '/', //模板、样式、脚本、图片等资源对应的server上的路径
        filename: 'js/[name].js', //每个页面对应的主js的生成配置
        chunkFilename: 'js/[id].chunk.js' //chunk生成的配置
    },
    module: {
        rules: [ //加载器，关于各个加载器的参数配置，可自行搜索之。
            {
                test: /\.css$/,
                use: ['css-hot-loader', MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],
                include: [resolve('src')], //限制范围，提高打包速度
                exclude: /node_modules/
            },
            {
            test:/\.less$/,
                use: ['css-hot-loader', MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'less-loader'],
                include: [resolve('src')],
                exclude: /node_modules/
            },
            {
                //html模板加载器，可以处理引用的静态资源，默认配置参数attrs=img:src，处理图片的src引用的资源
                //比如你配置，attrs=img:src img:data-src就可以一并处理data-src引用的资源了，就像下面这样
                test: /\.html$/,
                loader: 'html-loader',
                options: {
                    attrs: [':data-src']
                }
            },
            {
                test: /\.jsx?$/,
                loader: 'happypack/loader?id=happy-babel-js',
                include: [path.resolve('src')],
                exclude: /node_modules/,
            },
            {
                test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
                loader: 'url-loader',
                options: {
                    limit: 1 * 1024,
                    name: assetsPath('img/[name].[hash:7].[ext]')
                }
            },
            {
                test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
                loader: 'url-loader',
                options: {
                    limit: 1 * 1024,
                    name: assetsPath('media/[name].[hash:7].[ext]')
                }
            },
            {
                test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
                loader: 'url-loader',
                options: {
                    limit: 1 * 1024,
                    name: assetsPath('fonts/[name].[hash:7].[ext]')
                }
            }
        ]
    },
    optimization: {
        splitChunks: {
            cacheGroups: {
                commons: {
                    chunks: "initial",
                    name: "common",
                    minChunks: 2,
                    maxInitialRequests: 5,
                    minSize: 0
                }
            }
        }
    },
    resolve : {
        // 使用的拓展名
        extensions: [ ".js", ".html", ".json"],
        alias: {
            // 模块别名里诶包
            '@': resolve('src')
        }
    },
    plugins: [
        new HappyPack({ //开启多线程打包
            id: 'happy-babel-js',
            loaders: ['babel-loader?cacheDirectory=true'],
            threadPool: happyThreadPool
        }),
        new ProgressBarPlugin({
            format: '  build [:bar] ' + chalk.green.bold(':percent') + ' (:elapsed seconds)'
        }), 
        new PurifyCSSPlugin({
            paths: glob.sync(path.join(__dirname, '..', 'src/**/*.html'))
        }),
        new OptimizeCSSPlugin({
            cssProcessorOptions: {safe: true}
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
            // 有兴趣可以探究一下使用uglifyES
        }),
        new webpack.DllReferencePlugin({
            // 找到在dll中生成的manifest文件
            manifest: require(path.join(__dirname, '..', 'dist', 'manifest.json')),
        }),
        new MiniCssExtractPlugin({
            filename: "[name].css",
            chunkFilename: "[id].css"
        }),
        // new ExtractTextWebapckPlugin('css/[name].[hash].css'),
        new webpack.ProvidePlugin({
            $: 'jquery'
            // _:'lodash' //所有页面都会引入 _ 这个变量，不用再import引入
        }),
        //HtmlWebpackPlugin，模板生成相关的配置，每个对于一个页面的配置，有几个写几个
        new HtmlWebpackPlugin({ //根据模板插入css/js等生成最终HTML
            favicon: 'src/img/favicon.ico', //favicon路径，通过webpack引入同时可以生成hash值
            filename: 'view/index.html', //生成的html存放路径，相对于path
            template: 'src/view/index.html', //html模板路径
            hash: true, //为静态资源生成hash值
            chunks: ['common', 'index'],//需要引入的chunk，不配置就会引入所有页面的资源
            minify: { //压缩HTML文件    
                removeAttributeQuotes:true//压缩 去掉引号
            }
        }),
        new HtmlWebpackPlugin({ //根据模板插入css/js等生成最终HTML
            favicon: 'src/img/favicon.ico', //favicon路径，通过webpack引入同时可以生成hash值
            filename: 'view/list.html', //生成的html存放路径，相对于path
            template: 'src/view/list.html', //html模板路径
            hash: true, //为静态资源生成hash值
            chunks: ['common', 'list'],//需要引入的chunk，不配置就会引入所有页面的资源
            minify: { //压缩HTML文件    
                removeAttributeQuotes:true//压缩 去掉引号
            }
        }),
        new HtmlWebpackPlugin({ //根据模板插入css/js等生成最终HTML
            favicon: 'src/img/favicon.ico', //favicon路径，通过webpack引入同时可以生成hash值
            filename: 'view/about.html', //生成的html存放路径，相对于path
            template: 'src/view/about.html', //html模板路径
            hash: true, //为静态资源生成hash值
            chunks: ['common', 'about'],//需要引入的chunk，不配置就会引入所有页面的资源
            minify: { //压缩HTML文件    
                removeAttributeQuotes:true//压缩 去掉引号
            }
        }),
        new CopyWebpackPlugin([
            {
                from: path.join(__dirname, '..', 'src/img'),
                to: path.join(__dirname, '..', 'dist/img'),
                ignore: ['.*']
            }
        ]),
        new CleanWebpackPlugin([path.join(__dirname, '..', 'dist')]),
        new webpack.HotModuleReplacementPlugin(), //模块热更新
        new webpack.NamedModulesPlugin(), //模块热更新
    ],
    devtool: 'eval-source-map', // 指定加source-map的方式
    //使用webpack-dev-server，提高开发效率
    devServer: {
        contentBase: path.join(__dirname, '..', 'dist'),
        compress: true,
        host: '0.0.0.0',
        port: 9000,
        hot: true,
        overlay: {
            warnings: true,
            errors: true
        }
    }
};