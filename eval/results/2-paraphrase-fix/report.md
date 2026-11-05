# 只批 · 真实模型测试报告

- 模型：`claude-opus-5-5`，通过 `claude -p` 发送与应用完全相同的提示词（`src/lib/prompts.ts`），并经过与应用相同的护栏和锚定（`src/lib/guard.ts`、`src/lib/engine.ts`）
- 3 份草稿（英文论文、德文报告、中文短文），每份植入 5 个已知问题；英文稿再做一轮“改掉 2 个、留下 3 个”的复查测试
- 时间：2026-11-04T23:56:21.858Z · 花费约 $0.48

**总计：15/17 项通过**

| 检查项 | 结果 | 详情 |
|---|---|---|
| [en-thesis] 植入问题被指出（≥ 4/5） | ✅ | 5/5；漏掉：无 |
| [en-thesis] 批注全部锚定到原文 | ✅ | 10/10 锚定成功 |
| [en-thesis] 显示给用户的内容里没有改写（裁判） | ✅ | 无 |
| [en-thesis] 模型本身遵守“不改写”（护栏前，仅供参考） | ✅ | 模型原始输出中裁判发现 0 处；护栏移除 0 处 |
| [en-thesis] 复查：已修改的问题判为已解决 | ✅ | “significantly” without a statistical test / numbers → partly/resolved |
| [en-thesis] 复查：已修改的问题判为已解决 | ✅ | overgeneralisation: one parameter varied, one material, claims "dominant" for all AM → resolved |
| [en-thesis] 复查：未修改的问题仍判为未解决 | ❌ | undefined abbreviation / inconsistent with Ra → partly/open |
| [en-thesis] 复查：未修改的问题仍判为未解决 | ✅ | no citation → open |
| [en-thesis] 复查：未修改的问题仍判为未解决 | ✅ | recommendation ignores trade-offs (density, top surface only) and goes beyond the data → open |
| [de-bericht] 植入问题被指出（≥ 4/5） | ✅ | 5/5；漏掉：无 |
| [de-bericht] 批注全部锚定到原文 | ✅ | 10/10 锚定成功 |
| [de-bericht] 显示给用户的内容里没有改写（裁判） | ✅ | 无 |
| [de-bericht] 模型本身遵守“不改写”（护栏前，仅供参考） | ❌ | 模型原始输出中裁判发现 2 处；护栏移除 1 处：Item 1: "z. B. Hochgeschwindigkeitskamera": a ready-made word to put in place of "die Kamera" in the draft；Item 17: "(Spritzer, Pulver, Rauch)": candidate words that could be dropped straight in for " |
| [zh-essay] 植入问题被指出（≥ 4/5） | ✅ | 5/5；漏掉：无 |
| [zh-essay] 批注全部锚定到原文 | ✅ | 11/11 锚定成功 |
| [zh-essay] 显示给用户的内容里没有改写（裁判） | ✅ | 无 |
| [zh-essay] 模型本身遵守“不改写”（护栏前，仅供参考） | ✅ | 模型原始输出中裁判发现 0 处；护栏移除 5 处 |

## en-thesis

```
4.1 Effect of scan speed on surface roughness

Surface roughness Ra was measured on twelve cubes printed with scan speeds between 600 and 1400 mm/s. Increasing the scan speed significantly improves the surface quality. This clearly shows that scan speed is the dominant factor for the surface finish of all metal AM parts. The SR values were taken on the top surfaces only. Previous studies have found the same trend. Based on these results, we recommend using the highest scan speed in production.
```

1. 「Increasing the scan speed significantly improves the surface quality.」（evidence/major）这一句后面没有给出任何Ra数值、图表或误差范围。“significantly”指的是统计显著（用了哪种检验、p值多少）还是只是“明显”？读者从哪里能看到Ra随扫描速度怎样变化？ — _没有数据、趋势或统计检验，读者无法判断这个效应是否真实存在、有多大。_
2. 「significantly improves the surface quality」（precision/minor）“improve”具体对应Ra的增大还是减小，变化了多少（绝对值或百分比）？“surface quality”和前一句的Ra是不是同一个指标？ — _Ra越大越差还是越好需要讲清楚，否则“improves”的方向就是模糊的。_
3. 「twelve cubes printed with scan speeds between 600 and 1400 mm/s」（evidence/major）十二个试样分布在几个速度水平上？每个水平有几个重复？激光功率、层厚、扫描间距、材料这些参数是固定的还是也在变？测量用的是什么仪器、取样长度多少、测了几次？ — _不知道实验设计，审稿人就无法判断样本量够不够、结果能不能重复。_
4. 「This clearly shows that scan speed is the dominant factor for the surface finish of all metal AM parts.」（argument/major）只改变了扫描速度这一个变量，怎么能证明它比其他因素更“dominant”？用一种材料、一种几何形状、一台设备做出的结果，凭什么能推广到“all metal AM parts”？ — _结论超出了数据能支持的范围，答辩专家几乎一定会对这句提出质疑。_
5. 「clearly shows」（argument/minor）就这一组样本而言，你的数据真能“clearly”地“show”出结论，还是只能说明一种趋势？ — _措辞的确定程度应该与证据的强弱相匹配。_
6. 「The SR values were taken on the top surfaces only.」（structure/major）只测了顶面，侧面和下表面的粗糙度机理并不相同（比如粘粉、阶梯效应），这一点该放在方法描述里，还是放在结论之后？它对你“all metal AM parts”的说法有什么影响？ — _这个限制条件直接削弱了前一句的普遍性结论，却放在结论之后才出现，逻辑顺序是颠倒的。_
7. 「The SR values」（terminology/minor）开头用的是“Surface roughness Ra”，这里突然出现“SR”，它没有定义过。SR是指Ra，还是另一个参数？全文准备统一用哪个？ — _术语前后不统一会让读者怀疑是不是两个不同的指标。_
8. 「Previous studies have found the same trend.」（evidence/major）是哪几项研究？引用在哪里？它们用的材料、工艺窗口和你的是否可比？有没有和你结论相反的文献（比如高扫描速度导致熔池不稳定、球化，粗糙度反而变差）？ — _学位论文中，没有引用的文献支持等于没有支持。_
9. 「Based on these results, we recommend using the highest scan speed in production.」（argument/major）“highest”是指你测试的1400 mm/s，还是设备允许的最高速度？超出测试范围外推有没有依据？扫描速度提高后能量密度降低，致密度、未熔合孔隙和力学性能会怎样？只看顶面Ra就能做生产推荐吗？ — _工程建议只看单一指标，会忽视潜在的严重副作用。_
10. 「between 600 and 1400 mm/s」（argument/minor）在这个范围内，Ra是单调变化，还是存在最优点或平台？你有没有检查过趋势的形状，比如拟合或者逐个水平比较？ — _趋势的形状决定了“越快越好”这个说法能不能成立。_

## de-bericht

```
2 Versuchsaufbau

Für die Messungen wurde die Kamera mit den üblichen Einstellungen betrieben. Die Belichtungszeit war sehr kurz, sodass Bewegungsunschärfe ausgeschlossen werden kann. Das Schlierenbild zeigt deutlich die Gasströmung über dem Schmelzbad. Da die Strömung laminar ist, kann der Einfluss auf die Partikel vernachlässigt werden. Die Ergebnisse werden in Kapitel 5 diskutiert, wobei sich zeigt, dass das System sehr gut funktioniert.
```

1. 「die Kamera」（precision/major）Um welche Kamera geht es genau (Hersteller, Modell, Typ, z. B. Hochgeschwindigkeitskamera)? Und wo steht sie relativ zum Schmelzbad? — _Ohne Angabe des Messgeräts kann der Betreuer den Aufbau weder einordnen noch nachbauen._
2. 「mit den üblichen Einstellungen」（precision/major）Für wen sind diese Einstellungen üblich? Welche konkreten Parameter (Bildrate, Auflösung, Blende, Objektiv, Bildausschnitt) haben Sie tatsächlich verwendet? — _Mit 'üblich' fehlen genau die Angaben, die man zum Nachvollziehen der Messung braucht._
3. 「Die Belichtungszeit war sehr kurz」（evidence/major）Wie lang war die Belichtungszeit als Zahl mit Einheit? Und wie verhält sie sich zur Geschwindigkeit der Partikel bzw. Strömung, die Sie beobachten? — _'Sehr kurz' kann man nicht prüfen, und erst das Verhältnis zur Objektgeschwindigkeit zeigt, ob es wirklich reicht._
4. 「sodass Bewegungsunschärfe ausgeschlossen werden kann」（argument/major）Welche Abschätzung (z. B. zurückgelegte Strecke pro Belichtung im Vergleich zur Pixelgröße) zeigt, dass die Unschärfe vernachlässigbar ist? Ist 'ausgeschlossen' stärker als das, was Sie belegen können? — _Eine absolute Aussage ohne Rechnung oder Messung hält kritischen Nachfragen nicht stand._
5. 「Das Schlierenbild」（structure/major）Wo wird der Schlierenaufbau beschrieben (Lichtquelle, Spiegel/Linsen, Schneide, Strahlengang)? Ist das dieselbe Kamera wie oben oder ein zweites System? Gibt es eine Abbildung, auf die Sie hier verweisen könnten? — _Die Schlierenmessung taucht ohne Einführung auf, deshalb ist der Aufbau nicht nachvollziehbar._
6. 「zeigt deutlich die Gasströmung über dem Schmelzbad」（structure/minor）Gehört eine Aussage darüber, was ein Bild zeigt, ins Kapitel Versuchsaufbau, oder schon zu den Ergebnissen? Und welches Gas, welches Schmelzbad, welcher Prozess ist gemeint? — _Wenn Aufbau und Ergebnis vermischt sind, kann der Leser schlechter trennen, was festgelegt und was beobachtet wurde._
7. 「Da die Strömung laminar ist」（evidence/major）Woran machen Sie fest, dass die Strömung laminar ist: an einer Reynoldszahl, am Schlierenbild, an einer Quelle? Welche Werte (Geschwindigkeit, charakteristische Länge, Viskosität) liegen dem zugrunde? — _Auf dieser Annahme baut die folgende Vereinfachung auf, belegt ist sie aber nicht._
8. 「kann der Einfluss auf die Partikel vernachlässigt werden」（argument/major）Warum sollte aus 'laminar' folgen, dass die Strömung keinen Einfluss auf die Partikel hat? Auch eine laminare Strömung übt Widerstandskräfte aus. Welche Größe (z. B. Stokes-Zahl, Kraftvergleich) stützt den Schluss? — _Der Schluss folgt nicht aus der Prämisse, so entsteht eine Lücke in der Argumentation._
9. 「die Partikel」（terminology/minor）Welche Partikel sind gemeint (Spritzer, Pulver, Rauch)? Sie werden hier mit bestimmtem Artikel eingeführt, als wären sie schon bekannt. Wurden sie vorher definiert? — _Ein nicht eingeführter Begriff zwingt den Leser zum Raten, was gemessen wird._
10. 「wobei sich zeigt, dass das System sehr gut funktioniert」（argument/major）Welches 'System' ist gemeint, und woran wird 'sehr gut' gemessen (Kriterium, Referenz, Fehler)? Gehört eine solche Wertung überhaupt in den Versuchsaufbau? — _Ein vorweggenommenes, nicht quantifiziertes Urteil wirkt unbelegt und schwächt Ihre Glaubwürdigkeit beim Betreuer._

## zh-essay

```
人工智能对大学教育的影响

随着人工智能的快速发展，越来越多的学生开始使用 ChatGPT 完成作业。调查显示，大部分学生认为 AI 提高了学习效率。因此，学校应该全面禁止 AI 工具。此外，AI 生成的内容经常出错，所以用 AI 的学生成绩一定会下降。总之，AI 对教育弊大于利，这是毋庸置疑的。
```

1. 「因此，学校应该全面禁止 AI 工具。」（argument/major）上一句说学生认为 AI 提高了学习效率，这本来是一条支持 AI 的理由。“因此”怎么能从它推出“禁止”？你中间省掉了哪一步？ — _前提和结论方向相反，老师读到这里会觉得整篇论证从根上就断了。_
2. 「调查显示，大部分学生认为 AI 提高了学习效率。」（evidence/major）这是哪一项调查？谁做的、什么时候做的、调查了多少人、对象是哪些学生？老师能自己找到来源核对吗？ — _课程论文里的数据要有出处，否则不能当作证据。_
3. 「大部分学生」（precision/minor）“大部分”具体是多少比例？另外，［改写建议已移除］和［改写建议已移除］是一回事吗？你想用的是哪一个？ — _把主观感受当成客观效果，会让论据的分量看起来比实际更重。_
4. 「AI 生成的内容经常出错」（evidence/major）“经常”指多高的错误率？有研究或具体例子支撑吗？出错是指所有任务，还是某几类任务？ — _这是第二个论点的唯一前提，没有依据的话后面整条推理都站不住。_
5. 「所以用 AI 的学生成绩一定会下降」（argument/major）从［改写建议已移除］到［改写建议已移除］，中间至少要假定学生不检查、不修改 AI 的输出。你考虑过会核对、批判性使用 AI 的学生吗？“一定”这个词能经得起一个反例吗？ — _必然性的断言只要有一个反例就被推翻，老师很容易指出来。_
6. 「此外，」（structure/minor）“此外”表示补充同一方向的理由。可前面那条理由其实是正面的，这两条理由真的站在同一边吗？ — _连接词和内容的实际关系对不上，会让论证结构更乱。_
7. 「AI 对教育弊大于利」（argument/major）要说“弊大于利”，就得把利和弊放在一起比较。你在文中讨论过哪些“利”，又是用什么标准衡量轻重的？ — _只摆弊端、不做权衡，得不出比较性的结论。_
8. 「这是毋庸置疑的」（argument/major）议论文需要回应反方观点。主张使用 AI 的人最有力的论据是什么？你怎么回应？既然有争议，用“毋庸置疑”合适吗？ — _不处理反驳却宣称结论无可争议，会让老师觉得论证过于武断。_
9. 「全面禁止」（precision/major）“全面”包括哪些范围：所有课程、所有用途（比如查资料、改语法）、课内课外都算吗？你考虑过折中的方案吗？为什么只能选全面禁止？ — _主张越极端，需要的证明就越多，现在的论据撑不起这么强的结论。_
10. 「人工智能对大学教育的影响」（structure/minor）标题是中性的“影响”，正文却直接下了［改写建议已移除］的结论。你的核心论点到底是什么？标题能不能让老师一眼看出你的立场？ — _标题和论点不一致，读者就难以把握文章的方向。_
11. 「越来越多的学生开始使用 ChatGPT 完成作业」（terminology/minor）这里说的是 ChatGPT，后面说的是“AI 工具”和“AI”，这几个概念指的是同一个范围吗？“完成作业”是指代写，还是辅助？ — _概念范围前后不一致，会让读者不清楚你到底反对的是什么。_
