/* ============================================================
 * 哈尔滨理工大学光线独立游戏制作社团 · 网站内容配置
 * ============================================================
 * 内容来源：工作区内的社团 PDF 文档（腾讯文档导出）
 *  - 光线独立游戏制作社团.pdf           → 社团简介
 *  - 社团发展时间线.pdf（已压缩）       → 社团时间线
 *  - 社团游戏收录（持续更新~）.pdf      → 社团作品展示
 *  - 游戏开发知识库（持续更新~）.pdf     → 社团知识库
 *  - 程序篇.pdf / 策划篇.pdf            → 社团知识库 / 社团分享
 *  - 【牛顿的烈焰激光剑】【白日溪河】【章鱼】系列 → 社团分享
 *
 * 说明：
 *  - image / cover 字段留空字符串 "" 时，自动使用内置「光线」占位图。
 *  - link / links 字段为跳转地址，留 "" 表示暂无链接。
 * ============================================================ */

window.CLUB_DATA = {

  /* ---------- 站点全局配置 ---------- */
  site: {
    name: "哈尔滨理工大学光线独立游戏制作社团",
    shortName: "光线",
    nameEn: "LIGHT RAY INDIE GAME CLUB",
    shortEn: "LIGHTRAY",
    slogan: "以光为笔，创造世界",
    sloganEn: "CRAFT WORLDS WITH LIGHT",
    founded: "2023",
    location: "哈尔滨理工大学 · 体育馆地下室 · 不定期线下聚会",
    email: "",
    theme: "#ffffff",
    // 社交链接（暂无公开地址，可后续补充）
    social: [
      { label: "Bilibili", url: "" },
      { label: "GitHub", url: "" },
      { label: "itch.io", url: "" },
      { label: "QQ 群", url: "" }
    ]
  },

  /* ---------- 1. 社团简介 ---------- */
  intro: {
    lead: "一群热爱游戏开发的人！成立于 2023 年 7 月，到现在已经走过整整两个年头。",
    paragraphs: [
      "光线独立游戏制作社团是一支以「创作」为核心的独立游戏爱好者团队。社团的诞生源于初代社长黄传实赴沈阳参加 CIGA GameJam 的经历——被现场纯粹的合作开发氛围感染，回到学校后便创建了光线。",
      "社团面向所有对游戏开发感兴趣的同学：无论你是程序、策划、美术、音效，还是只想先来围观学习，这里都有一束属于你的光。我们以项目制协作、以分享促成长，一起走通「从想法到作品」的完整旅程。",
      "社团历年作品已收录进《社团游戏收录》合集（百度网盘持续更新）。下载解压后双击 .exe 即可运行，请勿点击 UnityCrashHandler64.exe。"
    ],
    // 关键数据（数字 + 标签）
    stats: [
      { num: "400+", label: "社团成员" },
      { num: "20+", label: "核心成员" },
      { num: "2", label: "发展年数" },
      { num: "10+", label: "社团作品" }
    ],
    // 专注方向
    focus: ["Unity", "Unreal", "C# / C++", "策划案", "像素美术", "叙事设计", "玩法原型", "Game Jam"]
  },

  /* ---------- 2. 社团时间线（已按原文压缩） ---------- */
  timeline: [
    {
      date: "2023.07",
      title: "社团诞生契机",
      text: "初代社长黄传实赴沈阳参加 CIGA GameJam，被现场纯粹的合作氛围感染，回校后决心创建游戏开发社团。",
      image: ""
    },
    {
      date: "2023.09",
      title: "社团成立 · 首次迎新",
      text: "百团大战上以首款自研小游戏亮相，光线独立游戏制作社团正式成立。",
      image: ""
    },
    {
      date: "2023.10",
      title: "活动场地落地",
      text: "7 公寓地下室获批，举办首场《Break》主题头脑风暴策划案活动，社员热情高涨。",
      image: ""
    },
    {
      date: "2024.01",
      title: "首战 Global Game Jam 沈阳站",
      text: "主题「Make Me Laugh」，《马了个戏》获好评如潮奖、《快乐催化师》获特别好评奖。",
      image: ""
    },
    {
      date: "2024.03–05",
      title: "吉比特未来制作人大赛 & CUSGA",
      text: "组两队双线参赛，《暗潮》赛后上架 Steam 页面，参赛成员快速成长。",
      image: ""
    },
    {
      date: "2024.07",
      title: "CIGA GameJam 沈阳站（一周年）",
      text: "建社一周年重返梦开始的地方，作品《恶魔狭间》荣获特别好评奖。",
      image: ""
    },
    {
      date: "2024.09–10",
      title: "第二次招新 & TapTap 聚光灯挑战赛",
      text: "吸纳新一批核心成员；TapTap 主题「Light」挑战赛组出三队创作。",
      image: ""
    },
    {
      date: "2024.11",
      title: "UGDAP 游戏巡航计划·哈尔滨站",
      text: "与行业嘉宾深度交流，并同长春理工等多所高校游戏开发社团建立联系。",
      image: ""
    },
    {
      date: "2025.01",
      title: "Global Game Jam 沈阳站",
      text: "主题「Bubble」，新生队作品《流浪气泡》玩法与完成度俱佳，取得较好成绩。",
      image: ""
    },
    {
      date: "2025.07",
      title: "CIGA GameJam 沈阳站",
      text: "老、中、小三队齐出，作品《Shutter》《灵魂引擎》《货灵物语》全部获奖。",
      image: ""
    },
    {
      date: "2025.09",
      title: "第三次招新 · 场地复活",
      text: "社长交接至荔枝（王浩），体育馆地下室新场地获批，社团迎来第三个年头。",
      image: ""
    }
  ],

  /* ---------- 3. 社团作品展示（来源：社团游戏收录·OCR 整理） ---------- */
  works: [
    {
      name: "2023 社团招新展品",
      nameEn: "WELCOME GAME 2023",
      cover: "",
      tags: ["迎新", "小游戏"],
      desc: "社团初次招新时为迎新开发的小游戏，也是光线第一款公开亮相的作品。",
      links: [
        { label: "网盘·解压即玩合集", url: "https://pan.baidu.com/s/1ff6-qyoBYS8_EAzl9AOLHw?pwd=ih6d" },
        { label: "网盘·独立压缩包合集", url: "https://pan.baidu.com/s/1a3AeWwkLsSYSQ8rV29C4kA?pwd=n61w" },
        { label: "网盘·持续更新文件夹", url: "https://pan.baidu.com/s/59s8n8RYq5Lbruq6COb3B7w" }
      ],
      status: "2023.09"
    },
    {
      name: "量子灭 QUANTUM QUENCHING",
      nameEn: "QUANTUM QUENCHING",
      cover: "",
      tags: ["三消", "公益开发"],
      desc: "2023 爱满星空公益开发活动参赛作品，三消类型。",
      links: [
        { label: "网盘·解压即玩合集", url: "https://pan.baidu.com/s/1ff6-qyoBYS8_EAzl9AOLHw?pwd=ih6d" }
      ],
      status: "2023.10"
    },
    {
      name: "马了个戏",
      nameEn: "THE CIRCUS",
      cover: "",
      tags: ["派对游戏", "Global Game Jam"],
      desc: "2024 Global Game Jam 沈阳站好评如潮作品，派对游戏。",
      links: [
        { label: "网盘·解压即玩合集", url: "https://pan.baidu.com/s/1ff6-qyoBYS8_EAzl9AOLHw?pwd=ih6d" }
      ],
      status: "好评如潮奖"
    },
    {
      name: "快乐催化师",
      nameEn: "JOY CATALYST",
      cover: "",
      tags: ["类胡闹厨房", "Global Game Jam"],
      desc: "2024 Global Game Jam 沈阳站特别好评作品，类《胡闹厨房》。",
      links: [
        { label: "网盘·解压即玩合集", url: "https://pan.baidu.com/s/1ff6-qyoBYS8_EAzl9AOLHw?pwd=ih6d" }
      ],
      status: "特别好评奖"
    },
    {
      name: "Equal To P",
      nameEn: "EQUAL TO P",
      cover: "",
      tags: ["解谜", "Global Game Jam"],
      desc: "2024 Global Game Jam 深圳凉屋站票数最多作品，将开发主题与布尔代数结合的解谜游戏。",
      links: [
        { label: "网盘·解压即玩合集", url: "https://pan.baidu.com/s/1ff6-qyoBYS8_EAzl9AOLHw?pwd=ih6d" }
      ],
      status: "票数最多"
    },
    {
      name: "暗潮",
      nameEn: "DARK TIDE",
      cover: "",
      tags: ["塔防", "吉比特未来制作人"],
      desc: "2024 吉比特未来游戏制作人大赛参赛作品，塔防类型，赛后上架 Steam 页面。",
      links: [
        { label: "网盘·解压即玩合集", url: "https://pan.baidu.com/s/1ff6-qyoBYS8_EAzl9AOLHw?pwd=ih6d" }
      ],
      status: "Steam 页面"
    },
    {
      name: "山海棋魂",
      nameEn: "SPIRIT OF MOUNTAINS & SEAS",
      cover: "",
      tags: ["飞行棋肉鸽", "CUSGA"],
      desc: "2024 CUSGA 全国大学生游戏开发大赛参赛作品，飞行棋肉鸽 + 骰子战斗。",
      links: [
        { label: "网盘·解压即玩合集", url: "https://pan.baidu.com/s/1ff6-qyoBYS8_EAzl9AOLHw?pwd=ih6d" }
      ],
      status: "CUSGA 参赛"
    },
    {
      name: "恶魔狭间",
      nameEn: "DEVIL'S GAP",
      cover: "",
      tags: ["卡牌肉鸽", "CIGA GameJam"],
      desc: "2024 CIGA GameJam 沈阳站特别好评作品，卡牌肉鸽。",
      links: [
        { label: "网盘·解压即玩合集", url: "https://pan.baidu.com/s/1ff6-qyoBYS8_EAzl9AOLHw?pwd=ih6d" }
      ],
      status: "特别好评奖"
    },
    {
      name: "飞驰萤生",
      nameEn: "FIREFLY DASH",
      cover: "",
      tags: ["3D", "战斗", "TapTap 聚光灯"],
      desc: "2024 TapTap 聚光灯游戏开发挑战赛参赛作品，3D 战斗类型。",
      links: [
        { label: "网盘·解压即玩合集", url: "https://pan.baidu.com/s/1ff6-qyoBYS8_EAzl9AOLHw?pwd=ih6d" }
      ],
      status: "TapTap 参赛"
    },
    {
      name: "洄",
      nameEn: "HUI · RETURN",
      cover: "",
      tags: ["剧情", "RPGMaker", "TapTap 聚光灯"],
      desc: "2024 TapTap 聚光灯游戏开发挑战赛参赛作品，以精致剧情获得不少票数。",
      links: [
        { label: "网盘·解压即玩合集", url: "https://pan.baidu.com/s/1ff6-qyoBYS8_EAzl9AOLHw?pwd=ih6d" }
      ],
      status: "人气作品"
    },
    {
      name: "Nap & Battle",
      nameEn: "NAP & BATTLE",
      cover: "",
      tags: ["横版战斗", "吉比特线上"],
      desc: "2024 吉比特线上 GameJam 参赛作品，横版战斗。",
      links: [
        { label: "网盘·解压即玩合集", url: "https://pan.baidu.com/s/1ff6-qyoBYS8_EAzl9AOLHw?pwd=ih6d" }
      ],
      status: "吉比特线上"
    },
    {
      name: "All You Have To Do Is Wake Up",
      nameEn: "ALL YOU HAVE TO DO IS WAKE UP",
      cover: "",
      tags: ["横版解谜", "吉比特线上"],
      desc: "2024 吉比特线上 GameJam 参赛作品，横版解谜。",
      links: [
        { label: "网盘·解压即玩合集", url: "https://pan.baidu.com/s/1ff6-qyoBYS8_EAzl9AOLHw?pwd=ih6d" }
      ],
      status: "吉比特线上"
    },
    {
      name: "流浪气泡",
      nameEn: "WANDERING BUBBLE",
      cover: "",
      tags: ["横版解谜", "Global Game Jam"],
      desc: "2025 Global Game Jam 沈阳站多半好评作品，机制有趣的横版解谜。",
      links: [
        { label: "网盘·解压即玩合集", url: "https://pan.baidu.com/s/1ff6-qyoBYS8_EAzl9AOLHw?pwd=ih6d" }
      ],
      status: "多半好评"
    },
    {
      name: "巴卜巴卜",
      nameEn: "BABU BABU",
      cover: "",
      tags: ["平台跳跃", "Global Game Jam"],
      desc: "2025 Global Game Jam 沈阳站活动作品，横版平台跳跃闯关。",
      links: [
        { label: "网盘·解压即玩合集", url: "https://pan.baidu.com/s/1ff6-qyoBYS8_EAzl9AOLHw?pwd=ih6d" }
      ],
      status: "活动作品"
    },
    {
      name: "Card StarShip",
      nameEn: "CARD STARSHIP",
      cover: "",
      tags: ["卡牌构筑", "CUSGA"],
      desc: "2025 CUSGA 全国大学生游戏开发大赛参赛作品，卡牌构筑。",
      links: [
        { label: "网盘·解压即玩合集", url: "https://pan.baidu.com/s/1ff6-qyoBYS8_EAzl9AOLHw?pwd=ih6d" }
      ],
      status: "CUSGA 参赛"
    },
    {
      name: "货灵物语",
      nameEn: "CARGO SPIRITS",
      cover: "",
      tags: ["经营", "类幸运房东", "CIGA GameJam"],
      desc: "2025 CIGA GameJam 沈阳站好评如潮作品，类《幸运房东》的经营玩法。",
      links: [
        { label: "网盘·解压即玩合集", url: "https://pan.baidu.com/s/1ff6-qyoBYS8_EAzl9AOLHw?pwd=ih6d" }
      ],
      status: "好评如潮奖"
    },
    {
      name: "灵魂引擎",
      nameEn: "SOUL ENGINE",
      cover: "",
      tags: ["老虎机战斗", "CIGA GameJam"],
      desc: "2025 CIGA GameJam 沈阳站多半好评作品，老虎机战斗。",
      links: [
        { label: "网盘·解压即玩合集", url: "https://pan.baidu.com/s/1ff6-qyoBYS8_EAzl9AOLHw?pwd=ih6d" }
      ],
      status: "多半好评"
    },
    {
      name: "逃离宿舍",
      nameEn: "ESCAPE THE DORM",
      cover: "",
      tags: ["恐怖", "个人作品"],
      desc: "社团成员 渲Alone 创作的恐怖游戏——很！恐！怖！",
      links: [
        { label: "网盘·解压即玩合集", url: "https://pan.baidu.com/s/1ff6-qyoBYS8_EAzl9AOLHw?pwd=ih6d" }
      ],
      status: "个人作品"
    },
    {
      name: "绕行地带",
      nameEn: "DETOUR ZONE",
      cover: "",
      tags: ["地牢", "打怪"],
      desc: "地牢打怪题材作品。",
      links: [
        { label: "网盘·解压即玩合集", url: "https://pan.baidu.com/s/1ff6-qyoBYS8_EAzl9AOLHw?pwd=ih6d" }
      ],
      status: "活动作品"
    },
    {
      name: "MVP Bird!",
      nameEn: "MVP BIRD!",
      cover: "",
      tags: ["休闲", "个人作品"],
      desc: "社团成员 渲Alone 创作的个人作品——「我老爸得了 MVP!」。",
      links: [
        { label: "网盘·解压即玩合集", url: "https://pan.baidu.com/s/1ff6-qyoBYS8_EAzl9AOLHw?pwd=ih6d" }
      ],
      status: "个人作品"
    }
  ],

  /* ---------- 4. 社团知识库（来源：游戏开发知识库目录） ---------- */
  knowledge: [
    {
      category: "策划篇",
      title: "部分类型游戏核心体验解构",
      articleId: "core-experience",
      desc: "解构类银河恶魔城、塔防、多人合作、养成等品类的核心体验与乐趣点，帮新人策划建立「理解玩家为什么付费」的基本素养。",
      tags: ["策划", "核心体验"],
      author: "牛顿的烈焰激光剑",
      date: "2025.09",
      link: ""
    },
    {
      category: "策划篇",
      title: "游戏机制与玩法",
      articleId: "mechanic-play",
      desc: "厘清机制与玩法的区别与关系：由机制组成玩法、由玩法构成体验；并举例弹反、钩锁、建造规划等常见玩法拆解。",
      tags: ["策划", "机制", "玩法"],
      author: "牛顿的烈焰激光剑",
      date: "2025.10",
      link: ""
    },
    {
      category: "策划篇",
      title: "设计思维",
      desc: "牛顿的烈焰激光剑系列策划分享之设计思维篇。",
      tags: ["策划", "设计思维"],
      author: "牛顿的烈焰激光剑",
      date: "",
      link: ""
    },
    {
      category: "策划篇",
      title: "拆解案例",
      desc: "牛顿的烈焰激光剑系列策划分享之拆解案例篇。",
      tags: ["策划", "拆解"],
      author: "牛顿的烈焰激光剑",
      date: "",
      link: ""
    },
    {
      category: "程序篇",
      title: "游戏开发程序入门指南，写给热爱游戏的你",
      articleId: "program-guide",
      desc: "从零基础到做出游戏 Demo 的程序学习路线：C/C++ 打基础 → 面向对象与数据结构 → C# → Unity → 参加 Game Jam。",
      tags: ["程序", "入门", "学习路线"],
      author: "白日溪河",
      date: "2024.10",
      link: ""
    },
    {
      category: "程序篇",
      title: "游戏开发程序学习课程推荐",
      articleId: "course-recommend",
      desc: "C# 语言与 Unity 开发优质课程盘点：刘铁猛 C#、唐老狮 C# 四部曲、M_Studio、Voidmatrix 等，附 B 站链接。",
      tags: ["程序", "课程推荐"],
      author: "章鱼",
      date: "",
      link: ""
    },
    {
      category: "程序篇",
      title: "如何让你的 Unity 游戏运行在 Windows 壁纸上",
      articleId: "unity-wallpaper",
      desc: "通过 P/Invoke 调用 Windows API（FindWindow、SetParent 等），把 Unity 游戏窗口挂到桌面壁纸层，实现「壁纸模式」。",
      tags: ["程序", "Unity", "Windows API"],
      author: "白日溪河",
      date: "",
      link: ""
    },
    {
      category: "美术篇",
      title: "美术篇（持续更新）",
      desc: "美术资源、像素画、场景与 UI 设计等内容整理中，敬请期待。",
      tags: ["美术"],
      author: "光线编辑部",
      date: "",
      link: ""
    },
    {
      category: "音乐篇",
      title: "音乐篇（持续更新）",
      desc: "游戏配乐、音效与免费音乐资源整理中，敬请期待。",
      tags: ["音乐", "音效"],
      author: "光线编辑部",
      date: "",
      link: ""
    },
    {
      category: "常用工具",
      title: "常用工具（持续更新）",
      desc: "开发常用引擎、编辑器与效率工具整理中，敬请期待。",
      tags: ["工具"],
      author: "光线编辑部",
      date: "",
      link: ""
    },
    {
      category: "书籍推荐",
      title: "书籍推荐（持续更新）",
      desc: "游戏设计、程序与美术相关书籍推荐整理中，敬请期待。",
      tags: ["书籍"],
      author: "光线编辑部",
      date: "",
      link: ""
    },
    {
      category: "教程&搬运资源",
      title: "教程&搬运资源（持续更新）",
      desc: "优质教程与搬运资源整理中，敬请期待。",
      tags: ["教程", "资源"],
      author: "光线编辑部",
      date: "",
      link: ""
    },
    {
      category: "游戏推荐解析与杂谈",
      title: "游戏推荐解析与杂谈（持续更新）",
      desc: "好游戏解析与杂谈内容整理中，敬请期待。",
      tags: ["解析", "杂谈"],
      author: "光线编辑部",
      date: "",
      link: ""
    },
    {
      category: "碎碎念",
      title: "碎碎念（持续更新）",
      desc: "成员随笔与碎碎念内容整理中，敬请期待。",
      tags: ["碎碎念"],
      author: "光线编辑部",
      date: "",
      link: ""
    }
  ],

  /* ---------- 5. 游戏开发活动收录（来源：社团发展时间线） ---------- */
  activities: [
    {
      name: "CIGA GameJam 沈阳站",
      type: "Game Jam",
      date: "2023.07",
      desc: "初代社长黄传实孤身赴沈阳参加 48 小时游戏开发挑战，社团诞生契机。",
      result: "梦开始的地方",
      link: ""
    },
    {
      name: "Global Game Jam 沈阳站",
      type: "Game Jam",
      date: "2024.01",
      desc: "主题「Make Me Laugh」，《马了个戏》《快乐催化师》双作品获奖。",
      result: "好评如潮奖 / 特别好评奖",
      link: ""
    },
    {
      name: "吉比特未来制作人大赛 & CUSGA",
      type: "比赛",
      date: "2024.03–05",
      desc: "组两队双线参赛，作品《暗潮》《山海棋魂》，《暗潮》赛后上架 Steam。",
      result: "参赛成员均获成长",
      link: ""
    },
    {
      name: "CIGA GameJam 沈阳站",
      type: "Game Jam",
      date: "2024.07",
      desc: "建社一周年，主题「Limited And Limitless」，作品《恶魔狭间》。",
      result: "特别好评奖",
      link: ""
    },
    {
      name: "TapTap 聚光灯 21 天创作挑战赛",
      type: "创作挑战赛",
      date: "2024.10",
      desc: "主题「Light」，组出老登队、新生队 1、新生队 2 及一支神秘队伍参赛。",
      result: "3 队 + 神秘队伍",
      link: ""
    },
    {
      name: "UGDAP 游戏巡航计划·哈尔滨站",
      type: "行业交流",
      date: "2024.11",
      desc: "UGDAP 大学生游戏开发联盟行业交流，与长春理工等高校社团建立联系。",
      result: "结识行业嘉宾与高校开发者",
      link: ""
    },
    {
      name: "吉比特线上 GameJam",
      type: "Game Jam",
      date: "2024.11",
      desc: "与群内外校开发者合作，诞生《All You Have To Do Is WakeUp》《Nap＆Battle》。",
      result: "2 款作品",
      link: ""
    },
    {
      name: "Global Game Jam 沈阳站",
      type: "Game Jam",
      date: "2025.01",
      desc: "主题「Bubble」，新生队《流浪气泡》表现亮眼。",
      result: "新生队获较好成绩",
      link: ""
    },
    {
      name: "吉比特赞助试玩会",
      type: "试玩会",
      date: "2025.04",
      desc: "由吉比特赞助的校内试玩会，四台电脑轮流试玩，气氛热烈。",
      result: "效果超预期",
      link: ""
    },
    {
      name: "CIGA GameJam 沈阳站",
      type: "Game Jam",
      date: "2025.07",
      desc: "老、中、小三队齐出，作品《Shutter》《灵魂引擎》《货灵物语》。",
      result: "全部获奖",
      link: ""
    },
    {
      name: "爱满星空公益游戏开发活动",
      type: "公益活动",
      date: "2025.09",
      desc: "社团场地恢复后举办的首场开发活动，开放参观，新老社员共同参与。",
      result: "场地恢复后的新起点",
      link: ""
    }
  ],

  /* ---------- 6. 游戏行业资讯 ---------- */
  news: [
    {
      date: "持续更新",
      title: "游戏行业资讯板块建设中",
      source: "光线编辑部",
      summary: "社团将陆续整理游戏行业动态、独立游戏扶持政策与参赛资讯，敬请期待。",
      link: ""
    }
  ],

  /* ---------- 7. 社团分享（来源：成员投稿文章） ---------- */
  shares: [
    {
      date: "2025.10",
      title: "【牛顿的烈焰激光剑】游戏机制与玩法",
      articleId: "mechanic-play",
      author: "牛顿的烈焰激光剑",
      topic: "策划",
      desc: "厘清机制与玩法的区别，举例弹反、钩锁、建造规划等常见玩法拆解，并附《三相奇谈》核心玩法拆解案例。",
      link: ""
    },
    {
      date: "2025.09",
      title: "【牛顿的烈焰激光剑】部分类型游戏核心体验解构",
      articleId: "core-experience",
      author: "牛顿的烈焰激光剑",
      topic: "策划",
      desc: "解构类银、塔防等品类以及多人合作、养成体验的核心体验与乐趣点，给新人策划启发思路。",
      link: ""
    },
    {
      date: "2024.10",
      title: "【白日溪河】游戏开发程序入门指南，写给热爱游戏的你",
      articleId: "program-guide",
      author: "白日溪河",
      topic: "程序",
      desc: "从编程小白到做出游戏 Demo 的完整学习路线：先打基础、再学 C# 与 Unity、最后去一次线下 Game Jam。",
      link: ""
    },
    {
      date: "持续更新",
      title: "【章鱼】游戏开发程序学习课程推荐",
      articleId: "course-recommend",
      author: "章鱼",
      topic: "程序",
      desc: "盘点 C# 与 Unity 优质课程：刘铁猛、唐老狮、M_Studio、Voidmatrix，附 B 站链接，帮你省下筛选时间。",
      link: ""
    },
    {
      date: "持续更新",
      title: "【白日溪河】如何让你的 Unity 游戏运行在 Windows 壁纸上",
      articleId: "unity-wallpaper",
      author: "白日溪河",
      topic: "技术",
      desc: "用 P/Invoke 调用 Windows API，把 Unity 窗口挂到桌面壁纸层，实现酷炫的「壁纸模式」，附实现思路与代码。",
      link: ""
    }
  ]
};
