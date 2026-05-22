import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON bodies
app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client
let googleGenAI: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!googleGenAI) {
    const key = process.env.GEMINI_API_KEY;
    // Check if key is available and not the default placeholder
    if (key && key !== "MY_GEMINI_API_KEY" && key.trim() !== "") {
      googleGenAI = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return googleGenAI;
}

// Memory Database
interface FoodTrendItem {
  id: string;
  keyword: string;
  dimension: 'flavor' | 'texture' | 'productType' | 'visual' | 'scene';
  volume: number;
  prevVolume: number;
  growthRate: number;
  warning: boolean;
  lifecycle: '萌芽期' | '成长期' | '成熟期' | '衰退期';
  forecastSentiment: number;
  platformDistribution: {
    xiaohongshu: number;
    douyin: number;
    bilibili: number;
    meituan: number;
  };
  sentimentPositive: number;
  sentimentNegative: number;
  sentimentNeutral: number;
  keyOpportunities: string[];
  keyRisks: string[];
}

let trendsDb: FoodTrendItem[] = [
  // --- 风味 Flavor ---
  {
    id: "f1",
    keyword: "开心果 (Pistachio Nut)",
    dimension: "flavor",
    volume: 12100,
    prevVolume: 3500,
    growthRate: 245.7,
    warning: true,
    lifecycle: "成长期",
    forecastSentiment: 9.3,
    platformDistribution: { xiaohongshu: 55, douyin: 25, bilibili: 10, meituan: 10 },
    sentimentPositive: 88, sentimentNegative: 4, sentimentNeutral: 8,
    keyOpportunities: ["开心果巴斯克", "开心果司康爆浆奶酪", "开心果生椰厚乳"],
    keyRisks: ["进口开心果仁原料成本上涨", "部分合成开心果香精带来的工业塑料感差评"]
  },
  {
    id: "f2",
    keyword: "陈皮红豆 (Aged Peel Red Bean)",
    dimension: "flavor",
    volume: 8200,
    prevVolume: 2500,
    growthRate: 228.0,
    warning: true,
    lifecycle: "萌芽期",
    forecastSentiment: 8.9,
    platformDistribution: { xiaohongshu: 35, douyin: 40, bilibili: 15, meituan: 10 },
    sentimentPositive: 82, sentimentNegative: 5, sentimentNeutral: 13,
    keyOpportunities: ["中式新潮陈皮红豆沙冰", "新茶饮陈皮红豆撞奶", "陈皮红豆雪媚娘大福"],
    keyRisks: ["五年以上陈皮货源溢价高", "年轻人对传统中药养生口味接受度呈两极分化"]
  },
  {
    id: "f3",
    keyword: "山茶花乌龙 (Camellia Oolong)",
    dimension: "flavor",
    volume: 14500,
    prevVolume: 9500,
    growthRate: 52.6,
    warning: false,
    lifecycle: "成熟期",
    forecastSentiment: 8.2,
    platformDistribution: { xiaohongshu: 45, douyin: 35, bilibili: 5, meituan: 15 },
    sentimentPositive: 76, sentimentNegative: 12, sentimentNeutral: 12,
    keyOpportunities: ["山茶花高定下午茶茶包礼盒", "瓶装无糖山茶花茶饮料极简包装"],
    keyRisks: ["行业同质化极高，几乎所有茶饮品牌均已推出此品类", "香精留香持久被部分挑剔消费者质疑添加合成香原料"]
  },
  {
    id: "f4",
    keyword: "生椰 (Raw Coconut)",
    dimension: "flavor",
    volume: 18900,
    prevVolume: 16500,
    growthRate: 14.5,
    warning: false,
    lifecycle: "成熟期",
    forecastSentiment: 8.0,
    platformDistribution: { xiaohongshu: 30, douyin: 40, bilibili: 10, meituan: 20 },
    sentimentPositive: 85, sentimentNegative: 4, sentimentNeutral: 11,
    keyOpportunities: ["升级版超高压冷榨生椰冻", "椰子水低卡运动代餐奶昔"],
    keyRisks: ["基础品类市场近于饱和，纯椰奶打法毛利受到压制"]
  },
  {
    id: "f5",
    keyword: "微甜薄荷柠檬 (Mild Mint Lemon)",
    dimension: "flavor",
    volume: 5100,
    prevVolume: 1600,
    growthRate: 218.8,
    warning: true,
    lifecycle: "萌芽期",
    forecastSentiment: 8.5,
    platformDistribution: { xiaohongshu: 40, douyin: 30, bilibili: 20, meituan: 10 },
    sentimentPositive: 79, sentimentNegative: 8, sentimentNeutral: 13,
    keyOpportunities: ["薄荷莫吉托无酒精气泡水", "重度薄荷黑巧克力脆皮冰淇淋"],
    keyRisks: ["“牙膏味”争议较大，不适宜全域铺货", "低温感原料配方在热饮中表现差"]
  },

  // --- 口感 Texture ---
  {
    id: "t1",
    keyword: "糯叽叽 (Soft & Chewy Mochi)",
    dimension: "texture",
    volume: 16200,
    prevVolume: 11500,
    growthRate: 40.9,
    warning: false,
    lifecycle: "成熟期",
    forecastSentiment: 8.8,
    platformDistribution: { xiaohongshu: 65, douyin: 20, bilibili: 5, meituan: 10 },
    sentimentPositive: 90, sentimentNegative: 3, sentimentNeutral: 7,
    keyOpportunities: ["烤麻薯芝士三明治", "麻薯开心果流心脏脏包", "糯叽叽椰浆双皮奶垫底"],
    keyRisks: ["冷藏易老化变硬，连锁配送温控挑战大", "高还原淀粉带来较高的饱腹感与卡路里焦虑"]
  },
  {
    id: "t2",
    keyword: "冰爽沙沙 (Frosty Granular Slush)",
    dimension: "texture",
    volume: 11500,
    prevVolume: 3200,
    growthRate: 259.4,
    warning: true,
    lifecycle: "成长期",
    forecastSentiment: 9.1,
    platformDistribution: { xiaohongshu: 30, douyin: 50, bilibili: 10, meituan: 10 },
    sentimentPositive: 84, sentimentNegative: 6, sentimentNeutral: 10,
    keyOpportunities: ["冷萃绿豆果肉沙沙冰", "巨峰葡萄爆汁手打冰沙杯"],
    keyRisks: ["季节性极强，春冬季销量下跌陡峭", "对门店大功率冰沙机设备依赖度高"]
  },
  {
    id: "t3",
    keyword: "爆浆流心 (Exploding Lava Center)",
    dimension: "texture",
    volume: 13500,
    prevVolume: 6200,
    growthRate: 117.7,
    warning: false,
    lifecycle: "成长期",
    forecastSentiment: 8.7,
    platformDistribution: { xiaohongshu: 50, douyin: 35, bilibili: 5, meituan: 10 },
    sentimentPositive: 86, sentimentNegative: 4, sentimentNeutral: 10,
    keyOpportunities: ["爆浆芋泥咸蛋黄可颂", "微苦黑巧松露爆浆蛋挞"],
    keyRisks: ["烘焙出炉后流心状态难以持久，微波复热不当易烫伤或塌陷"]
  },

  // --- 产品类型 Product Type ---
  {
    id: "p1",
    keyword: "精致法式司康 (Gourmet Scone)",
    dimension: "productType",
    volume: 9800,
    prevVolume: 3100,
    growthRate: 216.1,
    warning: true,
    lifecycle: "萌芽期",
    forecastSentiment: 8.6,
    platformDistribution: { xiaohongshu: 70, douyin: 15, bilibili: 5, meituan: 10 },
    sentimentPositive: 81, sentimentNegative: 9, sentimentNeutral: 10,
    keyOpportunities: ["迷你下午茶咸口葱香司康", "咸蛋黄肉酥夹心软司康"],
    keyRisks: ["消费者普遍存在“司康干硬难咽”的刻板印象，配方改良需主打润口度"]
  },
  {
    id: "p2",
    keyword: "低脂酸奶巴斯克 (Low-Fat Basque)",
    dimension: "productType",
    volume: 15200,
    prevVolume: 12500,
    growthRate: 21.6,
    warning: false,
    lifecycle: "成熟期",
    forecastSentiment: 8.4,
    platformDistribution: { xiaohongshu: 58, douyin: 22, bilibili: 10, meituan: 10 },
    sentimentPositive: 88, sentimentNegative: 5, sentimentNeutral: 7,
    keyOpportunities: ["希腊酸奶替代高脂奶油芝士的轻健巴斯克", "开心果酱流心巴斯克单人切片杯"],
    keyRisks: ["希腊酸奶烘烤后酸度较难平衡，处理不当会产生乳清分离现象"]
  },

  // --- 视觉 Visual ---
  {
    id: "v1",
    keyword: "国潮红瓷传统印记 (Guochao Red Ink)",
    dimension: "visual",
    volume: 10800,
    prevVolume: 3400,
    growthRate: 217.6,
    warning: true,
    lifecycle: "成长期",
    forecastSentiment: 9.0,
    platformDistribution: { xiaohongshu: 45, douyin: 35, bilibili: 15, meituan: 5 },
    sentimentPositive: 89, sentimentNegative: 2, sentimentNeutral: 9,
    keyOpportunities: ["汉砖雕花糕点伴手礼盒", "水墨扎染纸杯套及烫金纸袋"],
    keyRisks: ["极易让人觉得流于形式或者“过度包装”，设计原创度要求高"]
  },

  // --- 场景 Scene ---
  {
    id: "s1",
    keyword: "办公室午后解压解馋 (Office Stress-Relief)",
    dimension: "scene",
    volume: 14200,
    prevVolume: 4300,
    growthRate: 230.2,
    warning: true,
    lifecycle: "成长期",
    forecastSentiment: 8.8,
    platformDistribution: { xiaohongshu: 40, douyin: 30, bilibili: 10, meituan: 20 },
    sentimentPositive: 83, sentimentNegative: 6, sentimentNeutral: 11,
    keyOpportunities: ["独立单包装、无屑、不脏手的一次性小糕点", "办公室拼单免运费下午茶冷泡拿铁组套"],
    keyRisks: ["高热量零食容易导致白领内心充满负罪感，因此应打出“断糖/低卡/膳食纤维”概念"]
  }
];

// Mock Scraped Feeds Database representing multi-source public feedback
let feedsDb: any[] = [
  {
    id: "feed_1",
    platform: "小红书",
    title: "OMG这个开心果巴斯克！！糯叽叽太治愈了😭",
    content: "今天打卡了静安区这家新开的烘焙小馆，点的開心果巴斯克蛋糕也太惊艳了吧！上面铺了满满一层真实的开心果碎，里面居然是麻薯夹心！咬一口糯叽叽的，伴随着醇厚的干果香和流心，高级感拉满。多巴胺配色特别出片！就是排队站了一个小时，服务员手脚有点慢。另外由于原料太扎实，稍微有点重油，吃多了会觉得一点点腻，适合配热乌龙茶！",
    author: "美食甜心酱",
    authorFollowers: 125000,
    publishedAt: "2026-05-21 15:30",
    engagement: { likes: 3200, comments: 450, favorites: 1800, shares: 980 },
    aiAnalysis: {
      sentimentScore: 8.5,
      sentimentLabel: "正面",
      posKeywords: ["干果香", "流心", "糯叽叽", "出片"],
      negKeywords: ["排队时间长", "重油稍微腻"],
      extractedDimensions: {
        flavor: ["开心果", "奶酪"],
        texture: ["糯叽叽", "爆浆流心"],
        productType: ["巴斯克蛋糕"],
        visual: ["多巴胺配色"],
        scene: ["下午茶"]
      },
      rawSummary: "博主高度好评开心果搭配麻薯巴斯克蛋糕的创意组合，口感糯叽叽爽滑。对排队等待提出微言，建议提供茶饮解腻。"
    }
  },
  {
    id: "feed_2",
    platform: "大众点评",
    content: "排长队专门买他们家主打的司康！怎么说呢，开心果司康口感实在是有些太干了，一咬掉一桌子细屑，里面虽然塞了巧克力豆但是很突兀。店里环境搞成国潮风确实适合拍照，但是食物本身没有吹得那么神奇。32元一个性价比非常一般。建议老板配比增加一点黄油润湿，不然不喝茶真的很难咽下去。",
    author: "毒舌食客阿张",
    publishedAt: "2026-05-22 09:15",
    engagement: { likes: 124, comments: 48 },
    aiAnalysis: {
      sentimentScore: 4.2,
      sentimentLabel: "负面",
      posKeywords: ["国潮风格适合拍照"],
      negKeywords: ["口感太干", "掉碎屑", "性价比差"],
      extractedDimensions: {
        flavor: ["开心果", "巧克力"],
        texture: ["干硬掉渣"],
        productType: ["司康"],
        visual: ["国潮风"],
        scene: ["探店尝鲜"]
      },
      rawSummary: "用户对品牌司康给出低分评价，反映核心口感太干硬、易掉渣，提出配方改进建议（需增加滋润度），并吐槽32元客单价过高。"
    }
  },
  {
    id: "feed_3",
    platform: "抖音",
    title: "夏日爆款预警！绿豆果肉沙沙冰到底多解压？",
    content: "家人们谁懂啊！办公室下午三点困得要死，直接安排了一杯这个绿豆冰沙，一吸满口都是沙沙的冰霜感，里面还额外添加了绿豆仁，太有回甘了！清甜薄荷味道清凉提神，吸一口瞬间回血，工作效率直接翻倍。赶紧给你的办公室搭子拼一单！",
    author: "吃货先锋队",
    authorFollowers: 450000,
    publishedAt: "2026-05-20 14:00",
    engagement: { likes: 23100, comments: 1250, shares: 7800 },
    aiAnalysis: {
      sentimentScore: 9.4,
      sentimentLabel: "正面",
      posKeywords: ["冰爽沙沙", "清凉提神", "解压"],
      negKeywords: [],
      extractedDimensions: {
        flavor: ["薄荷", "绿豆"],
        texture: ["冰爽沙沙"],
        productType: ["冰沙/茶饮"],
        visual: [],
        scene: ["办公室解压", "下午茶"]
      },
      rawSummary: "视频达人极力安利薄荷绿豆冰沙作为办公室下午茶的首选，夸赞其冰凉提神、爽口回甘，在抖音中引发拼单热潮。"
    }
  }
];

// Competitors List database
let competitorsDb: any[] = [
  {
    id: "comp_1",
    brandName: "焙感心动 (Heartbaked & Co.)",
    avgRating: 4.6,
    activeDishesCount: 38,
    newLaunchDishes: [
      {
        name: "浓浓开心果软司康夹心",
        launchDate: "2026-05-10",
        price: 28,
        userRating: 4.7,
        keySellingPoints: ["双重厚开心果泥夹心", "外酥里湿配方"],
        aiCustomerPainPoints: ["每天限量20份极难抢到", "常温放置半天容易出油"]
      },
      {
        name: "茉莉薄荷芝士泡芙",
        launchDate: "2026-05-01",
        price: 22,
        userRating: 4.2,
        keySellingPoints: ["天然冷泡茉莉花粉", "清凉薄荷夹心冰凉"],
        aiCustomerPainPoints: ["薄荷味较淡，更像普通柠檬茉莉味泡芙"]
      }
    ],
    recentKolCampaigns: ["小红书 #夏日清凉绿色烘焙 种草挑战", "邀请50位上海本地美食博主联合直播推广"],
    pricingRange: "NT$25-45元 / 客单",
    scoreComparison: { taste: 8.8, service: 8.5, environment: 9.0, valueForMoney: 7.9 }
  },
  {
    id: "comp_2",
    brandName: "拾光古风烘焙 (Imperial Mill)",
    avgRating: 4.4,
    activeDishesCount: 45,
    newLaunchDishes: [
      {
        name: "陈皮红豆流心汉砖酥",
        launchDate: "2026-05-15",
        price: 18,
        userRating: 4.8,
        keySellingPoints: ["传统汉砖模古风压印", "咸甜老陈皮提鲜红豆流沙"],
        aiCustomerPainPoints: ["外皮较厚且易碎", "流心在冷藏状态下不流动"]
      }
    ],
    recentKolCampaigns: ["B站汉服达人联袂打卡 #大宋名仕点心"],
    pricingRange: "NT$12-28元 / 客单",
    scoreComparison: { taste: 8.5, service: 8.3, environment: 9.2, valueForMoney: 8.6 }
  }
];

// CRM/POS dummy records
let enterpriseUploadsDb: any[] = [
  {
    id: "up_1",
    dataType: "POS",
    uploadedAt: "2026-05-22 01:20",
    title: "2026年Q2全国门店销售统计明细表.csv",
    summary: "全国120家门店真实成交记录，反馈“椰香风味”与“麻薯”类别销量合计上涨38%。开心果味尝鲜购买率高但复购拉新率有一定分化。",
    recordCount: 45200
  },
  {
    id: "up_2",
    dataType: "CustomerComplaint",
    uploadedAt: "2026-05-21 18:45",
    title: "客服系统用户来电吐槽与退单分类归纳.xls",
    summary: "共分析84条客诉，投诉排名首位的是：新品“古风干司康”口感受干发柴，用户在无饮品配餐时极易发生吐槽噎嗓。占比45%。",
    recordCount: 84
  }
];

// Default dynamic intelligence reports list
let reportsDb: any[] = [
  {
    id: "rep_1",
    title: "今日食品行业爆发热点简报 (5月22日)",
    type: "daily",
    createdAt: "2026-05-22 01:00",
    summary: "监测到「开心果」全网日声量突增245.7%，形成绝对成长期爆发势头；同时「陈皮红豆」中式养生口味周飙升228.0%，值得研发部门快速响应。",
    generatedByAI: true,
    contentMarkdown: `## 🏆 每日热点简报 (5月22日版)

食品商情实时引擎于今天晨起对全网（小红书、抖音、美团、大众点评）公开讨论进行自动化探针监控，发现以下数个引发高互动率和点赞量极速飚飞的现象级关键词！

### 1. 开心果 (Pistachio Nut) —— 突破天花板的绿色风暴
- **本日声量指数**: 12,100 (+245.7%) —— **爆发式热点 🚨**
- **核心场景**: 下午茶打卡、多巴胺视觉烘焙。
- **消费者反馈偏好**: 浓郁的天然坚果干香。与传统的甜腻奶酪相比，「开心果酱 + 爆浆流心」能形成强烈的视觉反差并满足白领人士的高级感诉求。
- **推荐策略**: 建议对现有巴斯克或雪媚娘产品提供“开心果厚乳碎”的限定风味加料选项。

### 2. 陈皮红豆 (Aged Peel & Red Bean) —— 轻龄中式养生的崛起
- **本日声量指数**: 8,200 (+228.0%)  —— **爆发式热点 🚨**
- **核心场景**: 一人食健康滋补、夜猫子解压养生。
- **市场契机**: 区别于常规红豆沙，加入「陈皮」能有效缓解甜腻，增加陈香感，高度贴合当代年轻人“抗糖又护胃”的朋克养生观。

### 3. 精致干硬司康遭退单预警 —— 口感痛点提示
- **主诉痛点**: 反映“干发柴”、“卡嗓子”、“太干容易掉细屑”的用户负面评级环比上升 24%。
- **改良建议**: 研发部亟需对烘焙时间、面团持水率进行调优，增加椰子油或希腊酸奶乳化物保水度。
`
  }
];

// Memory User Personas Database
let personasDb: any[] = [
  {
    id: "per_1",
    avatar: "💼",
    name: "格子间低脂维稳族",
    genderDistribution: "女性 72% / 男性 28%",
    ageGroup: "24-34 岁",
    incomeLevel: "12k-20k/月",
    flavorPreferences: ["生椰", "薄荷柠檬", "陈皮红豆"],
    texturePreferences: ["冰爽沙沙"],
    preferredScenes: ["办公室解压", "常规续命下午茶"],
    painPoints: ["控糖减卡强迫症", "饱腹感过强带来的卡路里负罪感"],
    purchasingDrivers: { health: 90, flavor: 78, visual: 60, price: 50, convenience: 85 },
    preferredChannels: ["自营小程序外卖", "精品新式茶饮店"],
    spendingTrend: "balanced",
    aiDescription: "这是一群成长于高压办公环境下的白领群体，核心购买决策由‘健康减脂’主导。他们极易对传统的重糖、重油烘焙产生轻微排斥情绪。对能够打出‘希腊酸奶替代’、‘五年陈皮减甜’、‘清冷提神’标签 of 食品具有极佳黏性。"
  },
  {
    id: "per_2",
    avatar: "✨",
    name: "多巴胺颜控新奇客",
    genderDistribution: "女性 80% / 男性 20%",
    ageGroup: "18-28 岁",
    incomeLevel: "8k-15k/月",
    flavorPreferences: ["开心果", "山茶花乌龙"],
    texturePreferences: ["糯叽叽", "爆浆流心"],
    preferredScenes: ["闺蜜网红探店", "精致送礼/社交晒图"],
    painPoints: ["审美疲劳极快", "对平庸外观的食物零容忍"],
    purchasingDrivers: { health: 35, flavor: 85, visual: 98, price: 45, convenience: 60 },
    preferredChannels: ["网红连锁街区店", "小红书种草直达链接"],
    spendingTrend: "premium",
    aiDescription: "该圈层由极度活跃在朋友圈及小红书等视觉社交平台的年轻消费群体构成。高饱和度的产品配色、高颜值外观设计、高级的流心爆浆拉丝工艺，是其产生冲动性消费和自发传播裂变的导火索。极重品牌视觉概念与高定限定纸盒包装。"
  },
  {
    id: "per_3",
    avatar: "🍵",
    name: "朋克养生古风派",
    genderDistribution: "女性 65% / 男性 35%",
    ageGroup: "22-38 岁",
    incomeLevel: "10k-25k/月",
    flavorPreferences: ["陈皮红豆", "山茶花乌龙"],
    texturePreferences: ["糯叽叽"],
    preferredScenes: ["一人食微度假", "熬夜打工人回血"],
    painPoints: ["对纯中草药味反感，需要传统配方的年轻化创意", "产品添加人工防腐剂或强香溢精会直接一票否决"],
    purchasingDrivers: { health: 95, flavor: 82, visual: 75, price: 55, convenience: 70 },
    preferredChannels: ["中式新潮面包房", "老字号品牌线上天猫店"],
    spendingTrend: "premium",
    aiDescription: "这群消费者深度信奉‘熬最晚的夜，吃最天然的补品’。他们偏爱将传统中式滋补原料（如五年新会陈皮、药食同源红豆）通过新潮西点（如巴斯克、大福蛋糕）作为载物的混搭玩法。对高品质、清洁配方、原材料原产地证明以及微甘清润口感具有执着追求。"
  }
];

// API core routes
// Get all trends
app.get("/api/analytics/trends", (req, res) => {
  res.json({ status: "success", data: trendsDb });
});

// Create trend manually or simulate scraper
app.post("/api/analytics/trends/simulate", (req, res) => {
  const { keyword, dimension, simulatedIncrease } = req.body;
  
  if (!keyword || !dimension) {
    return res.status(400).json({ error: "Missing required parameters." });
  }

  const existing = trendsDb.find(t => t.keyword.toLowerCase().includes(keyword.toLowerCase()));
  if (existing) {
    existing.prevVolume = existing.volume;
    existing.volume = Math.round(existing.volume * (1 + (simulatedIncrease || 50) / 100));
    existing.growthRate = Number(((existing.volume - existing.prevVolume) / existing.prevVolume * 100).toFixed(1));
    existing.warning = existing.growthRate > 200;
    return res.json({ status: "success", message: `Updated and boosted existing keyword [${keyword}]`, data: existing });
  }

  const newId = "f_sim_" + Date.now();
  const vol = Math.round(1500 + Math.random() * 5000);
  const pVol = Math.round(vol / (1 + (simulatedIncrease || 210) / 100));
  const rate = Number(((vol - pVol) / pVol * 100).toFixed(1));

  const newItem: FoodTrendItem = {
    id: newId,
    keyword,
    dimension,
    volume: vol,
    prevVolume: pVol,
    growthRate: rate,
    warning: rate > 200,
    lifecycle: rate > 150 ? "成长期" : "萌芽期",
    forecastSentiment: Number((7.5 + Math.random() * 2).toFixed(1)),
    platformDistribution: { xiaohongshu: 40, douyin: 30, bilibili: 15, meituan: 15 },
    sentimentPositive: 80, sentimentNegative: 8, sentimentNeutral: 12,
    keyOpportunities: [`针对 [${keyword}] 开发独家限定甜品风味`, `跨界合作推出 [${keyword}] 专属主题包装`],
    keyRisks: ["短期营销概念热度容易在1个月内速退", "原料供应商渠道不够健全可能发生压货"]
  };

  trendsDb.unshift(newItem);
  res.json({ status: "success", message: `Created new trend item [${keyword}]`, data: newItem });
});

// Fetch raw Social / Dianping reviews feeds
app.get("/api/analytics/feeds", (req, res) => {
  res.json({ status: "success", data: feedsDb });
});

// Analyze review content utilizing Google GenAI SDK (gemini-3.5-flash) or robust analytics backend
app.post("/api/analytics/analyze-feed-item", async (req, res) => {
  const { platform, content, author } = req.body;
  if (!content) {
    return res.status(400).json({ error: "No review comments content provided for parsing." });
  }

  const aiClient = getGeminiClient();
  const targetAuthor = author || "匿名食客（自定义输入）";
  const targetPlatform = platform || "小红书";

  if (!aiClient) {
    // Elegant fallback simulator
    const score = content.includes("不值") || content.includes("碎") || content.includes("干") || content.includes("服务差") ? 4.5 : 8.8;
    const label = score > 7.5 ? "正面" : score > 5 ? "中性" : "负面";
    const simAnalysis = {
      id: "feed_sim_" + Date.now(),
      platform: targetPlatform,
      content,
      author: targetAuthor,
      publishedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      engagement: { likes: 12, comments: 2 },
      aiAnalysis: {
        sentimentScore: score,
        sentimentLabel: label,
        posKeywords: ["质感醇厚", "口味独特"],
        negKeywords: content.includes("干") ? ["口感干爽度不足"] : [],
        extractedDimensions: {
          flavor: ["芝士", "红豆"],
          texture: ["顺滑"],
          productType: ["饮品甜品"],
          visual: ["ins简约风"],
          scene: ["下午茶"]
        },
        rawSummary: "（模拟AI后台分析成功）用户分享了公开评价，内容情感偏向于「" + label + "」，认可创新搭配，提出工艺或定价建议。"
      }
    };
    feedsDb.unshift(simAnalysis);
    return res.json({ status: "success", mode: "simulated_local", data: simAnalysis });
  }

  try {
    const prompt = `分析下列食品行业的消费者评论或博主测评内容。请帮我进行细粒度的结构化分析。
内容: "${content}"

提取信息：
1. 评论情感分值 (0.0 至 10.0，分值越高情感越正面)
2. 情感大方向 (只能是 "正面" | "中性" | "负面")
3. 正面亮点关键词 (最多3个)
4. 负面痛点关键词 (最多3个, 若无则返回空数组)
5. 提及的消费者偏好细分类别，包含:
   - 风味 (Flavor keywords, e.g. 开心果, 抹茶)
   - 口感 (Texture keywords, e.g. 糯叽叽, 干柴)
   - 产品类型 (Product Category, e.g. 司康, 奶茶, 巴斯克)
   - 视觉 (Visual element, e.g. 多巴胺, 国潮, 水墨)
   - 场景 (Occasion/Scene, e.g. 办公室, 下午茶, 露营)
6. 简短提炼总结 (30字以内)

请严格输出为合法规范的 JSON，格式如下：
{
  "sentimentScore": 8.5,
  "sentimentLabel": "正面",
  "posKeywords": ["...", "..."],
  "negKeywords": ["...", "..."],
  "extractedDimensions": {
    "flavor": ["..."],
    "texture": ["..."],
    "productType": ["..."],
    "visual": ["..."],
    "scene": ["..."]
  },
  "rawSummary": "..."
}`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentimentScore: { type: Type.NUMBER },
            sentimentLabel: { type: Type.STRING },
            posKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            negKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            extractedDimensions: {
              type: Type.OBJECT,
              properties: {
                flavor: { type: Type.ARRAY, items: { type: Type.STRING } },
                texture: { type: Type.ARRAY, items: { type: Type.STRING } },
                productType: { type: Type.ARRAY, items: { type: Type.STRING } },
                visual: { type: Type.ARRAY, items: { type: Type.STRING } },
                scene: { type: Type.ARRAY, items: { type: Type.STRING } },
              }
            },
            rawSummary: { type: Type.STRING }
          },
          required: ["sentimentScore", "sentimentLabel", "posKeywords", "rawSummary"]
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    const newFeedItem = {
      id: "feed_ai_" + Date.now(),
      platform: targetPlatform,
      content,
      author: targetAuthor,
      publishedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      engagement: { likes: Math.round(5 + Math.random() * 45), comments: Math.round(Math.random() * 8) },
      aiAnalysis: parsed
    };

    feedsDb.unshift(newFeedItem);
    res.json({ status: "success", mode: "gemini_ai", data: newFeedItem });
  } catch (error: any) {
    console.error("Gemini feed analysis error:", error);
    res.status(500).json({ error: "Failed to perform AI analysis stream.", details: error.message });
  }
});

// Fetch competitor list
app.get("/api/analytics/competitors", (req, res) => {
  res.json({ status: "success", data: competitorsDb });
});

// Fetch corporate CRM / POS list
app.get("/api/analytics/enterprise", (req, res) => {
  res.json({ status: "success", data: enterpriseUploadsDb });
});

app.post("/api/analytics/upload-enterprise", (req, res) => {
  const { dataType, title, recordCount, summary } = req.body;
  const newUpload = {
    id: "up_" + Date.now(),
    dataType: dataType || "POS",
    uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    title: title || "企业未命名数据集.csv",
    summary: summary || "成功上传并由系统后台自动完成序列化，同步给系统主脑开展全盘校对分析。",
    recordCount: recordCount || 100
  };
  enterpriseUploadsDb.unshift(newUpload);
  res.json({ status: "success", data: newUpload });
});

// Fetch Reports list
app.get("/api/analytics/reports", (req, res) => {
  res.json({ status: "success", data: reportsDb });
});

// Generate dynamic reports using Gemini
app.post("/api/analytics/reports/generate", async (req, res) => {
  const { reportType, focalKeywords } = req.body;
  if (!reportType) {
    return res.status(400).json({ error: "Please indicate report type (daily, weekly, monthly, special_alert)" });
  }

  const aiClient = getGeminiClient();
  const keywordString = focalKeywords && focalKeywords.length > 0 ? focalKeywords.join(", ") : "开心果、司康、陈皮红豆、冰爽沙沙";
  
  const typeMap: Record<string, string> = {
    daily: "每日热点简报 (1页)",
    weekly: "每周趋势深度透视报告 (5-10页)",
    monthly: "月度消费者深度洞察及研发白皮书 (20-30页)",
    special_alert: "突发飙升热点专项预警研究报告"
  };

  const reportTypeName = typeMap[reportType] || "深度商情分析";

  if (!aiClient) {
    // Elegant fallback simulation
    const simulatedMd = `## 🏆 ${reportTypeName} (模拟生成)
> 生成时间: 2026-05-22 | 核心监测词库: ${keywordString}
### 📊 全网趋势总览
根据模拟商情雷达监测，本次针对 [ ${keywordString} ] 的指标分析表明：
- **市场声量总量**本区段环比提速约 **182.4%**；
- 主要流量发酵阵地依然在 **小红书 (52%)** 及 **抖音 (38%)**，分别主导了“生活方式美学”和“猎奇及美食测评”赛道。

### 💡 核心洞察归纳
1. **开心果风味持续极速狂飙**：通过对大众点评与美团商户菜单的动态追踪，带有“开心果”口味的面点和冷饮成交客单价达到了常规红豆/芝士风味的 $1.4$ 倍，品牌存在充分溢价空间。
2. **“软质糯叽叽”取代“一干到底”**：烘焙界对司康和法式面包的痛点评价高度集中在“咽干、掉渣、硬柴”等硬指标。而采用「糯叽叽烤麻薯夹心」或「乳清乳化黄油持水」改进工艺的产品好评率超过 95%。

### 🚀 战术推进与落地指南
- **研发建议**：尽快上线「轻岩盐开心果流沙司康」。
- **营销建议**：文案主打「一口爆浆、白领解压续命小饼乾」，切中办公室解馋下午茶场景。
`;
    const staticReport = {
      id: "rep_" + Date.now(),
      title: `${reportTypeName} - 针对 [${keywordString}] 专题研究`,
      type: reportType,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      summary: `监测并整合食品全维度偏好数据，分析发现 [${keywordString}] 市场成长属性非常明显，供研发、市场、KOL投放部门落地参考。`,
      generatedByAI: false,
      contentMarkdown: simulatedMd
    };
    reportsDb.unshift(staticReport);
    return res.json({ status: "success", mode: "simulated_local", data: staticReport });
  }

  try {
    const prompt = `您是食品行业的资深商业研究分析师与消费趋势专家。
请为我写一份高水平的、行文极其专业的 [${reportTypeName}]。
本次报告的核心聚焦主题/关键词为: "${keywordString}"。

请深入分析以下几个关键结构，并在正文以 Markdown 呈现:
1. 📈 行业宏观趋势深度解码 (对这几个词目前的网络声量爆发速度进行测算和背景分析)
2. 🔍 风味、口感与消费场景之间的细粒度交叉挖掘 (说明为什么现在这些产品元素能取得成功，例如消费者购买开心果背后的“高级感”和办公室“解压下午茶”的组合契机)
3. 📉 用户口碑声量痛点及避坑指南 (如原材料溢价问题、质地干硬掉碎屑的差评点)
4. 💡 落地化的具体产品研发配方构想 + 媒介投放与KOL种草包装文案构想

请先给出一个100字内的核心一句话摘要总结。

请将结果按如下格式以 JSON 回复，不要带有任何多余字符：
{
  "title": "食品行业 [报告名称/具体名称]",
  "summary": "一句话核心内容概要，必须包含100字内的干货总结",
  "contentMarkdown": "具体的Markdown排版正文内容，必须结构极其精巧，排版清晰美观，条理明确。请不要在Markdown中用三反引号框住自己，直接填写字符串即可。"
}`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            contentMarkdown: { type: Type.STRING }
          },
          required: ["title", "summary", "contentMarkdown"]
        }
      }
    });

    const reportJson = JSON.parse(response.text?.trim() || "{}");
    const newReport = {
      id: "rep_" + Date.now(),
      title: reportJson.title || `${reportTypeName} - 专题分析`,
      type: reportType,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      summary: reportJson.summary,
      generatedByAI: true,
      contentMarkdown: reportJson.contentMarkdown
    };

    reportsDb.unshift(newReport);
    res.json({ status: "success", mode: "gemini_ai", data: newReport });
  } catch (error: any) {
    console.error("Gemini report generation error:", error);
    res.status(500).json({ error: "AI failed to build complex report, please try again.", details: error.message });
  }
});

// Generate dynamic tactical Marketing Strategy based on raw inputs using Gemini
app.post("/api/analytics/strategies/generate", async (req, res) => {
  const { keyword, audience, budgetLevel } = req.body;
  if (!keyword) {
    return res.status(400).json({ error: "Missing selected core trend keyword." });
  }

  const aiClient = getGeminiClient();
  const selectedAudience = audience || "一二线城市年轻白领 / 办公室拼单群体";

  if (!aiClient) {
    // Fallback simulation
    const fallbackProposal = {
      id: "strat_" + Date.now(),
      title: `基于「${keyword}」的食品爆款破局企划书`,
      targetKeyword: keyword,
      targetAudience: selectedAudience,
      productBrief: {
        flavorSuggestion: `${keyword}配陈皮/香草流心层，降低甜度25%并提升质地厚度。`,
        textureSuggestion: "冰爽沙沙搭配内层糯叽叽的麻薯弹口，实现外脆内滑的多重层次。",
        visualDesign: "中式水墨扎染纸杯套、马卡龙多巴胺手提袋，凸显极高辨识度。",
        pricingEstimate: "建议门店主力客单价26-34元，保持约65%的高毛利利差空间。"
      },
      socialCampaignCopy: {
        xiaohongshuTitle: "谁懂啊！今天被这个神仙组合直接香晕了！",
        xiaohongshuBody: "姐妹们快看！全网顶流「" + keyword + "」居然还能跟糯叽叽搭档！一入口清甜丝滑，简直是办公室下午茶白领解压神器。减糖无负担！快艾特你的办公室搭子拼单吧！🎉",
        douyinVideoConcept: `${keyword}爆浆制作工艺特写镜头，黄金酥脆外皮被掰开的一瞬间，内部滑润的冷流心像瀑布般倾注而出，配以清脆愉悦的BGM。`,
        douyinHookLines: ["“你以为开心果只能用来剥着吃吗？”", "“这款下午茶，直接治好了全公司的精神内耗！”"]
      },
      eventPlanning: {
        theme: `全网寻找 [${keyword}] 爆浆新物种评测星计划`,
        promotions: "买新品即配「多巴胺解压编织袋」1个；工作日下午14:00-16:00两人成行立享7.5折促销。",
        kolTypes: ["美食测评博主 (占比50%)", "职场日常/白领日记博主 (占比30%)", "生活美学博主 (占比20%)"]
      },
      predictedOutcome: `方案上线后1周内在目标测试店有望实现客单量提升32%，结合小红书UGC话题自发打卡率可提高180%以上。`
    };
    return res.json({ status: "success", mode: "simulated_local", data: fallbackProposal });
  }

  try {
    const prompt = `您是一个食品和茶饮行业的顶尖CMO/高级媒介企划总监。
请围绕爆款趋势词 [ ${keyword} ]，针对目标客群 [ ${selectedAudience} ]，输出一整套富有创意、可直接执行的产品企划和全域媒体营销投放企划书。

请确保回复的数据结构完全一致，并输出为纯 JSON 对象：
{
  "title": "",
  "targetKeyword": "",
  "targetAudience": "",
  "productBrief": {
    "flavorSuggestion": "产品研发的风味调配建议",
    "textureSuggestion": "口感研发及改良建议",
    "visualDesign": "包装与视觉配色方案",
    "pricingEstimate": "客单定价分析与预测"
  },
  "socialCampaignCopy": {
    "xiaohongshuTitle": "爆款小红书吸睛大字标题",
    "xiaohongshuBody": "小红书种草长文，包含多标签 emoji",
    "douyinVideoConcept": "15秒抖音视频创意与画面运镜指令",
    "douyinHookLines": ["第1秒震撼钩子口播文案1", "第3秒钩子口播2"]
  },
  "eventPlanning": {
    "theme": "线下/线上联名或营销活动主题主题名称",
    "promotions": "门店促销折扣设计与福利激励机制",
    "kolTypes": ["建议重点合作的1到3种垂直博主类型"]
  },
  "predictedOutcome": "预计投资回报及裂变效应评估"
}`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            targetKeyword: { type: Type.STRING },
            targetAudience: { type: Type.STRING },
            productBrief: {
              type: Type.OBJECT,
              properties: {
                flavorSuggestion: { type: Type.STRING },
                textureSuggestion: { type: Type.STRING },
                visualDesign: { type: Type.STRING },
                pricingEstimate: { type: Type.STRING }
              },
              required: ["flavorSuggestion", "textureSuggestion", "visualDesign", "pricingEstimate"]
            },
            socialCampaignCopy: {
              type: Type.OBJECT,
              properties: {
                xiaohongshuTitle: { type: Type.STRING },
                xiaohongshuBody: { type: Type.STRING },
                douyinVideoConcept: { type: Type.STRING },
                douyinHookLines: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["xiaohongshuTitle", "xiaohongshuBody", "douyinVideoConcept", "douyinHookLines"]
            },
            eventPlanning: {
              type: Type.OBJECT,
              properties: {
                theme: { type: Type.STRING },
                promotions: { type: Type.STRING },
                kolTypes: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["theme", "promotions", "kolTypes"]
            },
            predictedOutcome: { type: Type.STRING }
          },
          required: ["title", "targetKeyword", "targetAudience", "productBrief", "socialCampaignCopy", "eventPlanning", "predictedOutcome"]
        }
      }
    });

    const strategyJson = JSON.parse(response.text?.trim() || "{}");
    res.json({ status: "success", mode: "gemini_ai", data: strategyJson });
  } catch (error: any) {
    console.error("Gemini strategy planning generator error:", error);
    res.status(500).json({ error: "AI failed to build strategy plan.", details: error.message });
  }
});

// Fetch all Customer Personas
app.get("/api/analytics/personas", (req, res) => {
  res.json({ status: "success", data: personasDb });
});

// Generate dynamic consumer portrait using Gemini
app.post("/api/analytics/personas/generate", async (req, res) => {
  const { keyword, demographic } = req.body;
  
  if (!keyword || !demographic) {
    return res.status(400).json({ error: "Missing required query parameters: keyword or demographic segment definition." });
  }

  const aiClient = getGeminiClient();
  const avatarList = ["🦄", "🥑", "🍪", "🔥", "🍹", "🔋", "👑", "🎯", "🍀", "🍇"];
  const randomAvatar = avatarList[Math.floor(Math.random() * avatarList.length)];

  if (!aiClient) {
    // Highly relevant mock persona generation
    const mockName = `${demographic}·${keyword.split(' ')[0]}先锋探审官`;
    const mockDriverWeight = {
      health: Math.round(40 + Math.random() * 55),
      flavor: Math.round(60 + Math.random() * 35),
      visual: Math.round(50 + Math.random() * 45),
      price: Math.round(30 + Math.random() * 55),
      convenience: Math.round(50 + Math.random() * 45)
    };
    
    const mockPersona = {
      id: "per_sim_" + Date.now(),
      avatar: randomAvatar,
      name: mockName,
      genderDistribution: Math.random() > 0.4 ? "女性 65% / 男性 35%" : "女性 45% / 男性 55%",
      ageGroup: demographic.includes("银发") ? "55-70 岁" : demographic.includes("Z世代") || demographic.includes("极客") ? "18-25 岁" : "25-45 岁",
      incomeLevel: demographic.includes("精英") || demographic.includes("白领") ? "15k-30k / 月" : "6k-12k / 月",
      flavorPreferences: [keyword, "清浅茶香", "咸甜焦糖"],
      texturePreferences: ["极富拉丝感", "酥脆起沙"],
      preferredScenes: ["深夜精致解馋", "周中能量能量补给"],
      painPoints: ["不健康带来的肥胖焦虑", "高工业甜腻感添加物带来的腻口差评"],
      purchasingDrivers: mockDriverWeight,
      preferredChannels: ["本地自营咖啡馆/茶铺", "拼团折扣外卖小程序"],
      spendingTrend: demographic.includes("白领") || demographic.includes("精英") ? "premium" : "balanced",
      aiDescription: `（模拟AI客群预测分析）针对圈层「${demographic}」与流行特质「${keyword}」的最新交叉研究显示，这是一个具有强劲圈层辨识力的美食心智群体。他们普遍认可优质烘焙食材，对新产品口味的包容度较高。如果能在「${keyword}」的基础上主打天然、低工业添加与视觉拉丝爆浆，将能进一步引发并锁死该垂直细分赛道的粘度。`
    };

    personasDb.unshift(mockPersona);
    return res.json({ status: "success", mode: "simulated_local", data: mockPersona });
  }

  try {
    const prompt = `您是食品和餐饮消费者研究所的首席研究员。
请根据风味口感特征词：[${keyword}] 以及消费者主群体定位：[${demographic}]，为我深度产出一套极其逼真且具有商业实操性的「食品消费者画像 (Consumer Persona)」。

输出属性：
1. 画像代表名称 (一个有概括力且非常吸引人的6-8字名称，例如"格子间低卡维稳族"、"多巴胺美学体验官")
2. 性别比例 (例如 "女性 70% / 男性 30%")
3. 年龄层段 (例如 "24-34 岁")
4. 收入水平 (例如 "12k-20k/月")
5. 针对该特征词的风味偏好 (2个词)
6. 针对该特征词的口感质地偏好 (2个词)
7. 典型消费场景 (2个场景)
8. 精准痛点/心智槽点 (2个痛点)
9. 五维购买驱动力权重分析 (0-100之间的整数):
   - 健康 (health)
   - 风味口感 (flavor)
   - 视觉美学 (visual)
   - 价格性价比 (price)
   - 便捷度 (convenience)
10. 首选触达渠道 (2种渠道)
11. 消费价格段倾向 (只能是: "premium" | "balanced" | "budget")
12. 专家视角的深度群体素描描述 (110字之内)

请严格输出为合法格式的 JSON，结构如下:
{
  "name": "...",
  "genderDistribution": "...",
  "ageGroup": "...",
  "incomeLevel": "...",
  "flavorPreferences": ["...", "..."],
  "texturePreferences": ["...", "..."],
  "preferredScenes": ["...", "..."],
  "painPoints": ["...", "..."],
  "purchasingDrivers": {
    "health": 85,
    "flavor": 90,
    "visual": 70,
    "price": 40,
    "convenience": 80
  },
  "preferredChannels": ["...", "..."],
  "spendingTrend": "premium",
  "aiDescription": "..."
}`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            genderDistribution: { type: Type.STRING },
            ageGroup: { type: Type.STRING },
            incomeLevel: { type: Type.STRING },
            flavorPreferences: { type: Type.ARRAY, items: { type: Type.STRING } },
            texturePreferences: { type: Type.ARRAY, items: { type: Type.STRING } },
            preferredScenes: { type: Type.ARRAY, items: { type: Type.STRING } },
            painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            purchasingDrivers: {
              type: Type.OBJECT,
              properties: {
                health: { type: Type.INTEGER },
                flavor: { type: Type.INTEGER },
                visual: { type: Type.INTEGER },
                price: { type: Type.INTEGER },
                convenience: { type: Type.INTEGER }
              },
              required: ["health", "flavor", "visual", "price", "convenience"]
            },
            preferredChannels: { type: Type.ARRAY, items: { type: Type.STRING } },
            spendingTrend: { type: Type.STRING },
            aiDescription: { type: Type.STRING }
          },
          required: [
            "name", "genderDistribution", "ageGroup", "incomeLevel", 
            "flavorPreferences", "texturePreferences", "preferredScenes", 
            "painPoints", "purchasingDrivers", "preferredChannels", 
            "spendingTrend", "aiDescription"
          ]
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    const newPersona = {
      id: "per_ai_" + Date.now(),
      avatar: randomAvatar,
      ...parsed
    };

    personasDb.unshift(newPersona);
    res.json({ status: "success", mode: "gemini_ai", data: newPersona });
  } catch (error: any) {
    console.error("Gemini persona generation error:", error);
    res.status(500).json({ error: "AI failed to generate dynamic customer persona.", details: error.message });
  }
});

// Chat endpoint via Gemini AI
app.post("/api/analytics/chat", async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Missing messages array in request body." });
  }

  const aiClient = getGeminiClient();

  if (!aiClient) {
    // Genuinely helpful simulated expert response
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    let responseText = `🤖 **【离线沙盒智脑解析】** 针对您关于「${lastUserMessage}」的咨询，大势智脑提出以下实战建议：\n\n`;

    if (lastUserMessage.includes('开心果') || lastUserMessage.includes('Pistachio')) {
      responseText += `### 🟢 开心果赛道精细化研发矩阵\n
- **风味解构**：开心果的高压油脂感需与「清爽解腻」成分配合。强烈建议尝试**「开心果 & 清羽马卡龙绿酸奶」**或**「开心果海草暴风雪」**。\n
- **质地口感建议**：表层高脆度「开心果碎粒碎坚果」 + 中层「轻盈希腊酸奶慕斯」 + 内层中心「糯叽叽糯米拉丝层」，层次对比提升120%复购黏性。\n
- **痛点拆解**：市面上诸多开心果粉带有香精味，强调**「100%纯坚果物理磨浆，零人工色素」**将是攻打格子间精致中坚白领的核心卖点。`;
    } else if (lastUserMessage.includes('趋势') || lastUserMessage.includes('爆款') || lastUserMessage.includes('风口')) {
      responseText += `### 📈 本季度烘焙与茶饮爆品预测风向标\n
1. **中式茶滋补 (Therapeutic Elixir)**：山茶花、五年陈皮红豆、青刺参等概念持续爆火。消费者不仅要口感，更要“天然无蔗糖负罪感”。\n
2. **质地游戏 (Texture Play)**：利用麻薯、青团麦青、水牛奶拉丝、坚果起泥带来的「无限拉丝/糯叽叽」动态，在抖音与小红书获得自发短视频裂变率极高。\n
3. **视觉多巴胺色彩 (Aesthetic Visuals)**：高饱和清冷马卡龙绿色調、极简水墨黑金包装最受年轻群体追捧。`;
    } else {
      responseText += `### 💡 爆款突围黄金三角模型\n
- **【第一角：差异化亮点（Hook）】** 将「${lastUserMessage}」与具有高社交打卡属性的质感成分（如流心、爆浆、冷萃）进行混搭。\n
- **【第二角：精准人群（Target）】** 针对 Z世代，聚焦在「新奇感、社交筹码及联名周边」；针对精致白领群，聚焦在「控糖、解压、冷处理」标签。\n
- **【第三角：文案攻势（Copywriting）】** 文案突出「不累嘴，无负担下午茶」等治愈性金句，主攻下午14点至16点白领点单黄金期。`;
    }

    return res.json({ status: "success", mode: "simulated_local", content: responseText });
  }

  try {
    const formattedContents = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const systemInstruction = `你是一个顶尖的食品与茶饮行业AI市场分析师与爆款战略顾问（Food & Beverage AI Analyst & CMO）。
你可以利用专业术语、趋势红警数据协助用户：
1. 分析全网社交风味趋势、消费人群行为；
2. 策划爆款食品新品，制定口味研发与质地口感组合建议；
3. 指导小红书（KOL/KOC）文案策划、精选营销卖点、抖音创意视频脚本设计；
4. 诊断竞品竞争优势与应对方案；
5. 给与直击核心客群圈层（如Z世代、白领等）心智的破局企划。

你的回复应该专业、条理清晰，多使用Markdown排版，包含折行、粗体文字、有序及无序列表，从而提供出色的可读性。请使用流利的中文进行专业回答。`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ status: "success", mode: "gemini_ai", content: response.text || "智脑有些走神了，请再试一次。" });
  } catch (error: any) {
    console.error("Gemini Chat interaction error:", error);
    res.status(500).json({ error: "AI failed to respond.", details: error.message });
  }
});

// Vite server integrations
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Use vite middlewares
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Food insights server started running on http://localhost:${PORT}`);
  });
}

startServer();
