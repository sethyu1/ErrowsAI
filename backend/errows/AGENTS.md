# Project Overview

- 此项目主要用 Nodejs 实现的后端 HTTP server，使用 moleculerJs 作为微服务框架，
- 包管理器使用的 pnpm, 使用了 monorepo 结构，项目根目录下有 packages 和 services 两个主要文件夹。
- packages 文件夹下存放的是各个模块的公共代码库，比如 models、ai, mailers 等。
- 此项目主要起 controller 作用，负责接收前端请求，调用各个微服务处理业务逻辑，并将结果返回给前端。

# Project Structure
- services/errows/*.service.mjs: 各个微服务的 service 定义文件。
- services/errows/api.service.mjs shi - API 网关服务定义文件，负责接收和路由 HTTP 请求。
- services/errows/api.service.mjs: API 网关服务定义文件，负责接收和路由 HTTP 请求。
- services/errows/config: 各个微服务的配置文件。
- services/errows/scripts: OPS 脚本文件。
- services/errows/db: 数据库相关文件。
- Model 层在 packages/models 中实现。

# API Documentation
- API 文档写在 docs/api.md 文件中。使用 markdown 格式编写，包含各个 API 的请求路径、方法、参数和返回值说明。
- API 设计遵循 RESTful 风格，使用标准的 HTTP 方法和状态码。
- API 文档中使用 `[!NOTE]` 来标注重要说明或注意事项。
- API 文档中使用 `#` 来标注各个模块的开始，使用 `##` 来标注各个 API 的开始。
- API 请求格式和响应格式都是用 typescript 定义的类型来描述的。写在 ## TYPES 部分。
- API 文档中每个 API 都包含 URL、REQ 和 RES 三个部分，分别描述请求路径和方法、请求参数和返回值格式。

# Project Commands

- 测试 server：在项目根目录下运行 pnpm run -s server test

# 代码规范
- 所有 IMPORT 语句都放在文件顶部。
- 不需要修复句尾空格， 文件保存后编辑器会自己 trim 掉句尾空格。
