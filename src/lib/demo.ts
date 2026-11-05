import { processComments, type Doc } from './engine';
import type { ReviewOut } from './prompts';

const DRAFT = `3.2 Influence of laser power on melt pool depth

In this work, the melt pool depth was measured for different laser powers. As can be seen, the melt pool gets significantly deeper when the laser power is increased, which proves that laser power is the most important parameter in PBF-LB/M. This is consistent with the literature.

The samples were produced on the machine with standard parameters and then cut and polished. The MPD was measured with a microscope. For higher powers, keyhole porosity appeared, which is obviously caused by the Marangoni effect. Therefore, a laser power of 250 W is recommended for all future experiments.`;

const RAW: ReviewOut['comments'] = [
  { quote: 'As can be seen', category: 'evidence', severity: 'major', question: '读者要在哪里“看到”？这句话指向的是哪一张图或哪一个表？', why: '没有图表编号，读者无法核对你的结论。' },
  { quote: 'significantly deeper', category: 'precision', severity: 'major', question: '“significantly” 是统计意义上的显著，还是只是“明显”？深了多少（数值、范围、样本数）？', why: '在学术写作里 significantly 会被理解为做过显著性检验。' },
  { quote: 'which proves that laser power is the most important parameter in PBF-LB/M', category: 'argument', severity: 'major', question: '你只改变了激光功率——没有比较其他参数，怎么能得出它“最重要”？“proves” 是否比你的数据能支撑的更强？', why: '结论超出了实验设计能回答的范围。' },
  { quote: 'This is consistent with the literature.', category: 'evidence', severity: 'major', question: '具体是哪些文献？它们的条件（材料、扫描速度、层厚）和你的一样吗？', why: '没有引用，读者无法判断“一致”的程度。' },
  { quote: 'standard parameters', category: 'clarity', severity: 'minor', question: '“standard” 对读者来说是哪些具体数值？别人能照着复现吗？', why: '方法部分的目标是可复现。' },
  { quote: 'MPD', category: 'terminology', severity: 'minor', question: '这个缩写第一次出现时定义了吗？前一段写的是 “melt pool depth”。', why: '同一个概念前后用不同写法会让读者犹豫是不是两样东西。' },
  { quote: 'which is obviously caused by the Marangoni effect', category: 'argument', severity: 'major', question: '“obviously” 的依据是什么？keyhole 气孔通常和哪种机制联系在一起，你的数据能区分不同机制吗？', why: '因果判断需要证据或引用，“显然”不能代替论证。' },
  { quote: 'a laser power of 250 W is recommended for all future experiments', category: 'argument', severity: 'major', question: '250 W 是从哪组数据得出的？“all future experiments” 包括不同材料和几何形状吗？', why: '推荐应该和前面的结果直接挂钩，并说明适用范围。' },
];

export function demoDoc(): Doc {
  const { comments } = processComments(RAW, DRAFT, 1, 1);
  return {
    id: 'demo-thesis',
    title: '示例：论文第 3.2 节',
    createdAt: Date.now(),
    meta: { genre: 'thesis', audience: '导师和答辩委员会', focus: '论证是否站得住' },
    drafts: [DRAFT],
    comments,
    strengths: ['小节标题直接说明了研究的变量关系，读者一眼就知道这一节要回答什么。', '实验流程（制样 → 切割抛光 → 显微测量）的顺序交代得很清楚。'],
    priorities: ['每一个结论都能指向一张图、一个数值或一条引用吗？', '你的实验设计能回答“最重要的参数”这个问题吗？如果不能，结论该收窄到什么程度？'],
    log: [{ at: Date.now(), action: 'review', model: '示例（离线）', comments: comments.length, redactions: 0, dropped: 0 }],
    demo: true,
  };
}
