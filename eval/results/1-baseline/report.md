# 只批 · 真实模型测试报告

- 模型：`claude-opus-5-5`，通过 `claude -p` 发送与应用完全相同的提示词（`src/lib/prompts.ts`），并经过与应用相同的护栏和锚定（`src/lib/guard.ts`、`src/lib/engine.ts`）
- 3 份草稿（英文论文、德文报告、中文短文），每份植入 5 个已知问题；英文稿再做一轮“改掉 2 个、留下 3 个”的复查测试
- 时间：2026-11-04T23:52:02.743Z · 花费约 $0.49

**总计：16/17 项通过**

| 检查项 | 结果 | 详情 |
|---|---|---|
| [en-thesis] 植入问题被指出（≥ 4/5） | ✅ | 5/5；漏掉：无 |
| [en-thesis] 批注全部锚定到原文 | ✅ | 11/11 锚定成功 |
| [en-thesis] 显示给用户的内容里没有改写（裁判） | ✅ | 无 |
| [en-thesis] 模型本身遵守“不改写”（护栏前，仅供参考） | ✅ | 模型原始输出中裁判发现 0 处；护栏移除 4 处 |
| [en-thesis] 复查：已修改的问题判为已解决 | ✅ | “significantly” without a statistical test / numbers → resolved/resolved |
| [en-thesis] 复查：已修改的问题判为已解决 | ✅ | overgeneralisation: one parameter varied, one material, claims "dominant" for all AM → resolved |
| [en-thesis] 复查：未修改的问题仍判为未解决 | ❌ | undefined abbreviation / inconsistent with Ra → partly/open |
| [en-thesis] 复查：未修改的问题仍判为未解决 | ✅ | no citation → open |
| [en-thesis] 复查：未修改的问题仍判为未解决 | ✅ | recommendation ignores trade-offs (density, top surface only) and goes beyond the data → open |
| [de-bericht] 植入问题被指出（≥ 4/5） | ✅ | 5/5；漏掉：无 |
| [de-bericht] 批注全部锚定到原文 | ✅ | 10/10 锚定成功 |
| [de-bericht] 显示给用户的内容里没有改写（裁判） | ✅ | 无 |
| [de-bericht] 模型本身遵守“不改写”（护栏前，仅供参考） | ✅ | 模型原始输出中裁判发现 0 处；护栏移除 0 处 |
| [zh-essay] 植入问题被指出（≥ 4/5） | ✅ | 5/5；漏掉：无 |
| [zh-essay] 批注全部锚定到原文 | ✅ | 10/10 锚定成功 |
| [zh-essay] 显示给用户的内容里没有改写（裁判） | ✅ | 无 |
| [zh-essay] 模型本身遵守“不改写”（护栏前，仅供参考） | ✅ | 模型原始输出中裁判发现 0 处；护栏移除 4 处 |

## en-thesis

```
4.1 Effect of scan speed on surface roughness

Surface roughness Ra was measured on twelve cubes printed with scan speeds between 600 and 1400 mm/s. Increasing the scan speed significantly improves the surface quality. This clearly shows that scan speed is the dominant factor for the surface finish of all metal AM parts. The SR values were taken on the top surfaces only. Previous studies have found the same trend. Based on these results, we recommend using the highest scan speed in production.
```

1. 「Increasing the scan speed significantly improves the surface quality.」（evidence/major）这句话没有给出任何数据。Ra 从多少变到多少？用了什么统计检验，p 值是多少？如果没做检验，“significantly”指的是统计显著，还是只是［改写建议已移除］？ — _审稿人看到“significantly”会默认指统计显著性，没有数据支撑，这个结论站不住。_
2. 「improves the surface quality」（precision/major）“improves”具体指 Ra 变大还是变小？“surface quality”和前面测的 Ra 是同一回事吗？读者怎么知道变化的方向？ — _方向和指标没说清楚，读者没法核对你的结论。_
3. 「This clearly shows that scan speed is the dominant factor for the surface finish of all metal AM parts.」（argument/major）你只改变了扫描速度这一个参数，怎么能和激光功率、层厚、扫描间距等其他因素比较，从而说它是“dominant”？十二个立方体用的是哪一种材料、哪一种工艺？凭什么推广到“all metal AM parts”？ — _单因素实验支撑不了［改写建议已移除］这个结论，推广的范围也远远超出了样本。_
4. 「twelve cubes printed with scan speeds between 600 and 1400 mm/s」（evidence/major）十二个样品分成几个速度水平？每个水平重复了几次？其他工艺参数（功率、层厚、材料、设备）是否保持不变？这些信息在本节或方法部分有没有交代？ — _不知道实验设计和控制变量，就无法判断趋势可不可信、能不能复现。_
5. 「Surface roughness Ra was measured」（evidence/minor）Ra 是用什么仪器、什么方法测的（接触式还是光学）？取样长度、截止波长是多少？每个面测了几次？ — _测量方法会影响 Ra 的数值和可比性，答辩委员会通常会追问。_
6. 「The SR values were taken on the top surfaces only.」（argument/major）既然只测了顶面，前一句关于“surface finish”的普遍结论还成立吗？侧面受扫描速度影响的机理和顶面一样吗？这个限制条件为什么放在结论之后，而不是测量说明里？ — _这个限制条件直接削弱了前面的结论，放的位置会让读者觉得论证前后矛盾。_
7. 「The SR values」（terminology/minor）“SR”在这里第一次出现，没有定义。它和第一句的“Surface roughness Ra”是同一个量吗？全节是否应该统一用一个术语？ — _术语前后不一致，读者需要猜测这几个词是否指同一参数。_
8. 「Previous studies have found the same trend.」（evidence/major）具体是哪些研究？它们用的材料、工艺和速度范围和你的一样吗？有没有结论相反的研究，比如速度过高时出现球化或未熔合，反而使粗糙度变差？ — _没有引用的文献对比在学位论文里不成立，而且忽略反例会让论证显得片面。_
9. 「Based on these results, we recommend using the highest scan speed in production.」（argument/major）［改写建议已移除］是指 1400 mm/s，还是设备的最高速度？超出你的测试范围也能这样推断吗？提高速度对致密度、孔隙率、力学性能有什么影响？只看顶面粗糙度，就足以作为生产建议吗？ — _只根据单一指标、在有限范围内的结果给出生产建议，忽略了权衡，审稿人一定会质疑。_
10. 「This clearly shows」（language/minor）你的数据量和实验设计，配得上“clearly”这么强的确定性吗？ — _在学术写作中，语气强度应该和证据强度相匹配。_
11. 「4.1 Effect of scan speed on surface roughness」（structure/minor）本节的顺序是：结果 → 结论 → 测量限制 → 文献 → 建议。按［改写建议已移除］的逻辑重新排列，是否更清楚？另外，有没有图或表来展示 Ra 随速度的变化？ — _结构混乱，而且缺少数据图表，读者很难跟上论证。_

## de-bericht

```
2 Versuchsaufbau

Für die Messungen wurde die Kamera mit den üblichen Einstellungen betrieben. Die Belichtungszeit war sehr kurz, sodass Bewegungsunschärfe ausgeschlossen werden kann. Das Schlierenbild zeigt deutlich die Gasströmung über dem Schmelzbad. Da die Strömung laminar ist, kann der Einfluss auf die Partikel vernachlässigt werden. Die Ergebnisse werden in Kapitel 5 diskutiert, wobei sich zeigt, dass das System sehr gut funktioniert.
```

1. 「mit den üblichen Einstellungen betrieben」（precision/major）Welche Einstellungen genau, also Bildrate, Belichtungszeit, Auflösung, Objektiv und Blende? Für wen gelten diese Einstellungen als „üblich“? — _Ohne konkrete Parameter kann der Betreuer den Versuch weder nachvollziehen noch wiederholen._
2. 「Für die Messungen wurde die Kamera」（clarity/major）Um welche Kamera handelt es sich (Hersteller, Modell, Typ) und was wurde überhaupt gemessen? Wo ist die Kamera relativ zum Schmelzbad angeordnet? — _Mit dem bestimmten Artikel wird eine Kamera vorausgesetzt, die bisher noch nirgends eingeführt wurde._
3. 「Die Belichtungszeit war sehr kurz」（precision/major）Wie lang war die Belichtungszeit in Mikrosekunden? Gemessen an welcher Partikel- oder Strömungsgeschwindigkeit ist sie „sehr kurz“? — _Ob „sehr kurz“ zutrifft, lässt sich nur prüfen, wenn Zahl und Vergleichsgröße angegeben sind._
4. 「sodass Bewegungsunschärfe ausgeschlossen werden kann」（argument/major）Wie weit bewegt sich ein Objekt während einer Belichtung, verglichen mit der Pixelgröße? Haben Sie das abgeschätzt oder berechnet? — _Die Schlussfolgerung beruht auf einer Annahme, die nirgends quantitativ begründet wird._
5. 「Das Schlierenbild zeigt deutlich die Gasströmung」（structure/major）Wo werden der Schlierenaufbau (Lichtquelle, Spiegel oder Linsen, Schneide) und das Gas beschrieben? Gehört eine Aussage über das, was ein Bild zeigt, in den Versuchsaufbau oder in die Ergebnisse? — _Ein Kapitel zum Versuchsaufbau sollte das Setup beschreiben und keine Beobachtungen vorwegnehmen._
6. 「Das Schlierenbild」（evidence/minor）Auf welches Bild bezieht sich der Satz? Gibt es dazu eine Abbildung mit Nummer und Verweis? — _„Deutlich“ kann der Leser nur beurteilen, wenn er das Bild auch sieht._
7. 「Da die Strömung laminar ist」（evidence/major）Woraus folgt, dass die Strömung laminar ist, etwa aus einer Reynolds-Zahl, aus Volumenstrom und Düsengeometrie oder aus einer Literaturquelle? — _Eine zentrale Annahme wird als Tatsache hingestellt, ohne sie zu belegen._
8. 「kann der Einfluss auf die Partikel vernachlässigt werden」（argument/major）Warum sollte eine laminare Strömung Partikel nicht beeinflussen? Auch laminare Strömungen üben Schleppkräfte aus. Welche Partikel sind gemeint, und wo werden sie eingeführt? — _Der logische Schritt von laminar zu vernachlässigbar fehlt, und der Begriff „Partikel“ kommt hier zum ersten Mal vor._
9. 「über dem Schmelzbad」（terminology/minor）Welcher Prozess erzeugt das Schmelzbad (z. B. Laserstrahlschmelzen oder Schweißen) und mit welchen Prozessparametern? — _Der Leser braucht den Prozesskontext, um Aufbau und Annahmen einordnen zu können._
10. 「wobei sich zeigt, dass das System sehr gut funktioniert」（argument/major）Nach welchem Kriterium wird „sehr gut“ bewertet? Welches „System“ ist gemeint? Und warum steht eine Bewertung der Ergebnisse im Kapitel zum Versuchsaufbau? — _Eine unbelegte Wertung an dieser Stelle schwächt die Glaubwürdigkeit und vermischt Methode mit Diskussion._

## zh-essay

```
人工智能对大学教育的影响

随着人工智能的快速发展，越来越多的学生开始使用 ChatGPT 完成作业。调查显示，大部分学生认为 AI 提高了学习效率。因此，学校应该全面禁止 AI 工具。此外，AI 生成的内容经常出错，所以用 AI 的学生成绩一定会下降。总之，AI 对教育弊大于利，这是毋庸置疑的。
```

1. 「因此，学校应该全面禁止 AI 工具。」（argument/major）前一句说的是学生认为 AI 提高了学习效率，这是对 AI 有利的证据。“因此”后面怎么会得出要禁止 AI 的结论？你能把这两句之间的推理一步步写出来吗？ — _前提和结论方向相反，老师读到这里会觉得论证自相矛盾。_
2. 「调查显示，大部分学生认为 AI 提高了学习效率。」（evidence/major）这是哪一项调查？由谁做的、什么时候做的、调查了多少人、“大部分”具体是多少比例？ — _课程论文里，没有出处的数据没法核实，也就没有说服力。_
3. 「AI 生成的内容经常出错」（evidence/major）“经常”有多频繁？你依据的是哪项研究、哪个测试，还是自己的观察？出错的是哪类内容？ — _这是你反对 AI 的核心理由，没有证据支撑，整个论证就站不住。_
4. 「所以用 AI 的学生成绩一定会下降」（argument/major）从［改写建议已移除］到［改写建议已移除］，中间缺了哪些条件？学生会不会核对、改正 AI 的错误？有没有成绩数据能支持“一定”这个说法？ — _因果链条中间断了，“一定”又把结论说得太绝对，读者很容易找到反例。_
5. 「学校应该全面禁止 AI 工具」（precision/major）“全面”指什么范围：所有课程、所有场合、所有 AI 工具都禁吗？有没有考虑过部分限制或规范使用这些折中办法，为什么不选它们？ — _不讨论其他方案就直接主张最极端的做法，论证会显得很片面。_
6. 「总之，AI 对教育弊大于利，这是毋庸置疑的。」（argument/major）全文提到过哪些“利”、哪些“弊”，你是怎么权衡的？前面唯一的数据说的其实是“利”，凭什么得出“弊大于利”？ — _结论需要建立在对两方面的比较上，而文中没有这种比较。_
7. 「这是毋庸置疑的」（language/minor）议论文里这一类断言能不能替代论证？如果有人持反对意见，这句话能说服他吗？ — _在学术写作中，绝对化的表达往往让读者更想质疑，而不是更信服。_
8. 「越来越多的学生开始使用 ChatGPT 完成作业」（evidence/minor）“越来越多”有数据或出处吗？另外，你的题目讲的是“人工智能”，这里只举了 ChatGPT，全文讨论的 AI 范围到底是什么？ — _讨论对象不明确，后面说“禁止 AI 工具”时，读者不知道具体指哪些工具。_
9. 「对大学教育的影响」（structure/minor）题目说的是“影响”，比较中性，正文却直接主张禁止。你的中心论点是什么？能不能在开头明确提出来，再分段展开？ — _全文只有一段，论点、论据、结论挤在一起，老师很难看出论证结构。_
10. 「此外」（structure/minor）“此外”表示补充同一方向的理由，但它前面的内容是支持 AI 的。这个连接词真的能把这两部分连起来吗？ — _连接词用错，会让读者更看不清你的论证方向。_
