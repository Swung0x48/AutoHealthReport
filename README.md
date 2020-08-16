# AutoHealthReport

自动完成每日疫情上报！

## 新功能:

为了方便大家可以在各种 ~~奇奇怪怪的~~ 地方部署的时候获取截图，现在成功上报后可以通过浏览器访问程序启动的 http 服务器获取截图。

默认端口为 `8124` 。若在内网环境下，请注意配置端口映射/防火墙/安全组/etc.

## 使用前请注意：

- 本程序不自带校内 VPN。请自行解决网络问题。[也许可以试试这个？](https://github.com/Swung0x48/docker-easyconnect)

- 为防止同时大量打卡造成高并发灾难，首次启动时会从 `0:00:00` - `6:59:59` 中随机抽取一个~~小朋友拿来煲汤~~时间进行打卡。 自行修改时间的功能~~稍后添加~~ 不添加了。请自行修改源码解决。

- 打卡成功的截图会被保存到 `content/screenshot` ， 同时会启动一个 http 服务器，直接访问也可获得截图。`content` 目录会生成其他也许对你运行失败时调试有帮助的文件，以及程序配置文件 `config.json`。若要重新配置，删除 `content` 目录即可。

- 使用本程序导致的任何问题作者概不负责（包括但不限于漏打卡、学校账号问题）。请自行衡量风险。

- 运行中的任何问题，请 [去提 issue](https://github.com/Swung0x48/AutoHealthReport/issues) 。若想要贡献代码，请 [提交 pull request](https://github.com/Swung0x48/AutoHealthReport/pulls) 。

- 本程序在 `Apache License 2.0` 下开源。

## 食用方法：

1. 首先你需要有一个 `node.js` 运行环境.
    - Windows: 你可以去 [node.js download](http://nodejs.cn/download/) 下载。请确保 node 和 npm 安装到你的环境变量中 (Add to PATH).
    - Linux/macOS: 使用你喜欢的包管理器安装 `node` 或 `nodejs` 软件包: [传送门](https://nodejs.org/zh-cn/download/package-manager/) 。也可以从源码编译。

1. 确保 `node.js` 已经被正确安装
    ```
    node -v
    ```
    应返回当前安装的 `node.js` 版本号。

1. 下载本仓库。
    - 你可以...
        1. [直接下载](https://github.com/Swung0x48/AutoHealthReport/archive/master.zip)
        2. 通过你喜欢的 git 工具 `clone` 这个仓库。
        ```
        git clone https://github.com/Swung0x48/AutoHealthReport.git
        ```
1. 安装必要的依赖。
    - 进入下载好的程序目录:
        - *nix:
        ```
        cd AutoHealthReport
        ```
        - Windows：
        请打开解压后的文件夹，按住 Shift，在窗口空白处按下鼠标右键， 选择 「在此处打开 PowerShell 窗口」或「在此处打开命令提示符窗口」
    - 安装依赖:
        ``` 
        npm install
        # yarn install # 如果你喜欢用 yarn 的话
        ```

1. 运行。
    ```
    npm run release
    # yarn run release # 如果你之前用的是 yarn 的话
    ```
   
1. 使用守护进程保持运行。

    如果担心 `node` 进程意外关闭，可使用 [pm2](https://www.npmjs.com/package/pm2) 或 [forever](https://www.npmjs.com/package/forever) 等守护进程保持其运行。
    
1. 更新。

    直接覆盖文件夹即可。
    
    或者也可以直接：
    ```
   git pull
    ```